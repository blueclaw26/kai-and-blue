#!/usr/bin/env python3
"""
JACS ASAP Paper Fetcher
- Fetches latest papers from JACS RSS feed
- Filters for organic chemistry / organic synthesis / catalysis
- Extracts abstracts and TOC graphics
- Outputs JSON for Discord posting
"""

import xml.etree.ElementTree as ET
import json
import re
import sys
import urllib.request
import urllib.error
import html
import os
from datetime import datetime, timedelta

FEED_URL = "https://pubs.acs.org/action/showFeed?type=axatoc&feed=rss&jc=jacsat"
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "posted_dois.json")

# Keywords for organic chemistry / synthesis / catalysis filtering
ORGANIC_KEYWORDS = [
    # Organic synthesis
    "synthesis", "synthetic", "catalysis", "catalyst", "catalytic",
    "cross-coupling", "coupling", "metathesis", "cycloaddition",
    "enantioselective", "asymmetric", "stereoselectiv", "diastereoselective",
    "organocatalys", "photocatalys", "electrocatalys",
    "radical", "free radical", "C-H activation", "C–H activation",
    "C-H functionalization", "C–H functionalization",
    "palladium", "nickel", "copper", "rhodium", "iridium", "ruthenium",
    "gold catal", "iron catal", "cobalt catal", "manganese",
    "ligand", "phosphine", "NHC", "N-heterocyclic carbene",
    # Organic chemistry
    "organic", "aryl", "alkyl", "vinyl", "allyl", "benzyl",
    "heterocycl", "aromatic", "ketone", "aldehyde", "amine", "amide",
    "ester", "carboxylic", "alcohol", "phenol", "ether",
    "alkene", "alkyne", "diene", "enone", "imine",
    "indole", "pyridine", "pyrrole", "furan", "thiophene",
    "boronic", "boronate", "Suzuki", "Heck", "Sonogashira",
    "Buchwald", "Negishi", "Stille", "Grignard", "Wittig",
    "olefin", "ring-closing", "ring-opening", "rearrangement",
    "total synthesis", "natural product", "alkaloid", "terpen",
    "polyketide", "peptide synthesis", "amino acid",
    "fluorination", "halogenation", "oxidation", "reduction",
    "hydrogenation", "dehydrogenation", "carbonylation",
    "carboxylation", "amination", "arylation", "alkylation",
    "acylation", "cyclization", "annulation",
    "flow chemistry", "electrochemistry", "photochemistry",
    "visible light", "photoredox", "electrosynthesis",
    # Reaction types
    "Diels-Alder", "Mannich", "Aldol", "Michael addition",
    "Friedel-Crafts", "nucleophilic", "electrophilic",
    "substitution", "elimination", "addition",
    "multicomponent", "cascade", "domino", "tandem",
    "click chemistry", "bioorthogonal",
    "C-C bond", "C–C bond", "C-N bond", "C–N bond",
    "C-O bond", "C–O bond", "bond formation",
]

def load_posted_dois():
    """Load previously posted DOIs to avoid duplicates."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return set(json.load(f))
    return set()

def save_posted_dois(dois):
    """Save posted DOIs."""
    with open(STATE_FILE, "w") as f:
        json.dump(list(dois), f, indent=2)

def fetch_feed():
    """Fetch JACS RSS feed."""
    req = urllib.request.Request(FEED_URL, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")

def extract_toc_image(description_html):
    """Extract TOC graphic URL from description HTML."""
    match = re.search(r'src="([^"]+)"', description_html)
    if match:
        return match.group(1)
    return None

def is_organic_chemistry(title, abstract=""):
    """Check if paper is related to organic chemistry/synthesis/catalysis."""
    text = (title + " " + abstract).lower()
    for keyword in ORGANIC_KEYWORDS:
        if keyword.lower() in text:
            return True
    return False

def fetch_abstract(doi_url):
    """Fetch abstract from ACS paper page."""
    try:
        abs_url = doi_url.replace("http://dx.doi.org/", "https://pubs.acs.org/doi/abs/")
        req = urllib.request.Request(abs_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = resp.read().decode("utf-8", errors="replace")
        
        # Try to extract abstract
        match = re.search(
            r'<p class="articleBody_abstractText">(.*?)</p>',
            page, re.DOTALL
        )
        if match:
            abstract = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            return html.unescape(abstract)
        
        # Alternative pattern
        match = re.search(
            r'class="hlFld-Abstract".*?<p[^>]*>(.*?)</p>',
            page, re.DOTALL
        )
        if match:
            abstract = re.sub(r'<[^>]+>', '', match.group(1)).strip()
            return html.unescape(abstract)
    except Exception as e:
        print(f"  Warning: Could not fetch abstract: {e}", file=sys.stderr)
    return ""

def parse_feed(xml_text, max_papers=3):
    """Parse RSS feed and return filtered papers."""
    root = ET.fromstring(xml_text)
    posted_dois = load_posted_dois()
    papers = []
    
    for item in root.findall(".//item"):
        title_el = item.find("title")
        link_el = item.find("link")
        desc_el = item.find("description")
        creator_el = item.find("{http://purl.org/dc/elements/1.1/}creator")
        pubdate_el = item.find("pubDate")
        
        if title_el is None or link_el is None:
            continue
        
        title = title_el.text.replace("[ASAP] ", "")
        doi_url = link_el.text
        doi = doi_url.replace("http://dx.doi.org/", "")
        
        # Skip already posted
        if doi in posted_dois:
            continue
        
        # First pass: check title
        if not is_organic_chemistry(title):
            continue
        
        authors = creator_el.text if creator_el is not None else ""
        description = desc_el.text if desc_el is not None else ""
        toc_image = extract_toc_image(description)
        pubdate = pubdate_el.text if pubdate_el is not None else ""
        
        # Fetch abstract for second pass filtering
        print(f"  Fetching abstract for: {title[:60]}...", file=sys.stderr)
        abstract = fetch_abstract(doi_url)
        
        papers.append({
            "title": title,
            "doi": doi,
            "doi_url": doi_url,
            "authors": authors,
            "abstract": abstract,
            "toc_image": toc_image,
            "pubdate": pubdate,
        })
        
        if len(papers) >= max_papers:
            break
    
    # Update posted DOIs
    new_dois = posted_dois | {p["doi"] for p in papers}
    save_posted_dois(new_dois)
    
    return papers

def main():
    max_papers = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    
    print("Fetching JACS ASAP feed...", file=sys.stderr)
    xml_text = fetch_feed()
    
    print("Parsing and filtering...", file=sys.stderr)
    papers = parse_feed(xml_text, max_papers=max_papers)
    
    print(f"Found {len(papers)} organic chemistry papers.", file=sys.stderr)
    print(json.dumps(papers, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
