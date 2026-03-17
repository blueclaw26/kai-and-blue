#!/usr/bin/env python3
"""
JACS ASAP Paper Poster
- Fetches papers via fetch_papers.py logic
- Downloads TOC images via browser (ACS blocks direct downloads)
- Posts to Discord #論文速報 channel
- Designed to run as OpenClaw cron job
"""

import xml.etree.ElementTree as ET
import json
import re
import sys
import os
import subprocess
import urllib.request
import html
import tempfile
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(SCRIPT_DIR, "posted_dois.json")
IMAGE_DIR = os.path.join(SCRIPT_DIR, "images")
DISCORD_CHANNEL = "channel:1482911654080675971"

FEED_URL = "https://pubs.acs.org/action/showFeed?type=axatoc&feed=rss&jc=jacsat"

# Organic chemistry keywords
ORGANIC_KEYWORDS = [
    "synthesis", "synthetic", "catalysis", "catalyst", "catalytic",
    "cross-coupling", "coupling", "metathesis", "cycloaddition",
    "enantioselective", "asymmetric", "stereoselectiv", "diastereoselective",
    "organocatalys", "photocatalys", "electrocatalys",
    "radical", "C-H activation", "C–H activation",
    "C-H functionalization", "C–H functionalization",
    "palladium", "nickel", "copper", "rhodium", "iridium", "ruthenium",
    "gold catal", "iron catal", "cobalt catal", "manganese",
    "ligand", "phosphine", "NHC", "N-heterocyclic carbene",
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
    "Diels-Alder", "Mannich", "Aldol", "Michael addition",
    "Friedel-Crafts", "nucleophilic", "electrophilic",
    "substitution", "elimination", "addition reaction",
    "multicomponent", "cascade", "domino", "tandem",
    "click chemistry", "bioorthogonal",
    "C-C bond", "C–C bond", "C-N bond", "C–N bond",
    "C-O bond", "C–O bond", "bond formation",
]


def load_posted_dois():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return set(json.load(f))
    return set()


def save_posted_dois(dois):
    with open(STATE_FILE, "w") as f:
        json.dump(sorted(list(dois)), f, indent=2)


def is_organic(title, abstract=""):
    text = (title + " " + abstract).lower()
    for kw in ORGANIC_KEYWORDS:
        if kw.lower() in text:
            return True
    return False


def extract_toc_url(desc_html):
    m = re.search(r'src="([^"]+)"', desc_html)
    return m.group(1) if m else None


def fetch_abstract(doi_url):
    try:
        abs_url = doi_url.replace("http://dx.doi.org/", "https://pubs.acs.org/doi/abs/")
        req = urllib.request.Request(abs_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = resp.read().decode("utf-8", errors="replace")
        m = re.search(r'<p class="articleBody_abstractText">(.*?)</p>', page, re.DOTALL)
        if m:
            return html.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip())
        m = re.search(r'class="hlFld-Abstract".*?<p[^>]*>(.*?)</p>', page, re.DOTALL)
        if m:
            return html.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip())
    except Exception as e:
        print(f"  Abstract fetch failed: {e}", file=sys.stderr)
    return ""


def download_toc_via_browser(image_url, output_path):
    """Download TOC image using OpenClaw browser to bypass hotlink blocking."""
    try:
        # Open image in browser
        result = subprocess.run(
            ["openclaw", "browser", "open", image_url],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            print(f"  Browser open failed: {result.stderr}", file=sys.stderr)
            return False

        time.sleep(3)

        # Extract base64 via JS fetch
        result = subprocess.run(
            ["openclaw", "browser", "evaluate", "--fn",
             "async () => { const r = await fetch(window.location.href); const b = await r.blob(); const rd = new FileReader(); return new Promise(ok => { rd.onload = () => ok(rd.result.split(',')[1]); rd.readAsDataURL(b); }); }"],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            print(f"  Browser evaluate failed: {result.stderr}", file=sys.stderr)
            return False

        import base64
        b64 = json.loads(result.stdout.strip())
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(b64))

        # Close the tab
        subprocess.run(
            ["openclaw", "browser", "evaluate", "--fn", "() => window.close()"],
            capture_output=True, text=True, timeout=5
        )

        return os.path.getsize(output_path) > 100

    except Exception as e:
        print(f"  Browser download failed: {e}", file=sys.stderr)
        return False


def post_to_discord(paper, image_path=None):
    """Post paper summary to Discord via openclaw message send."""
    # Truncate abstract for summary
    abstract = paper.get("abstract", "")
    if len(abstract) > 600:
        abstract = abstract[:597] + "..."

    msg = f"""## 📄 JACS ASAP — {paper.get('pubdate_short', '')}

### {paper['title_ja']}

**原題:** {paper['title']}
**著者:** {paper['authors']}
**DOI:** <https://doi.org/{paper['doi']}>

**要約（日本語）:**
{paper.get('summary_ja', abstract)}

🏷️ {paper.get('tags', '')}"""

    cmd = [
        "openclaw", "message", "send",
        "--channel", "discord",
        "--target", DISCORD_CHANNEL,
        "--message", msg,
    ]
    if image_path and os.path.exists(image_path):
        cmd.extend(["--media", image_path])

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        print(f"  ✅ Posted: {paper['title'][:50]}...", file=sys.stderr)
        return True
    else:
        print(f"  ❌ Post failed: {result.stderr}", file=sys.stderr)
        return False


def main():
    max_papers = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    os.makedirs(IMAGE_DIR, exist_ok=True)

    print("Fetching JACS ASAP feed...", file=sys.stderr)
    req = urllib.request.Request(FEED_URL, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        xml_text = resp.read().decode("utf-8")

    root = ET.fromstring(xml_text)
    posted_dois = load_posted_dois()
    posted_count = 0

    for item in root.findall(".//item"):
        if posted_count >= max_papers:
            break

        title_el = item.find("title")
        link_el = item.find("link")
        if title_el is None or link_el is None:
            continue

        title = title_el.text.replace("[ASAP] ", "")
        doi_url = link_el.text
        doi = doi_url.replace("http://dx.doi.org/", "")

        if doi in posted_dois:
            continue

        if not is_organic(title):
            continue

        desc_el = item.find("description")
        creator_el = item.find("{http://purl.org/dc/elements/1.1/}creator")
        pubdate_el = item.find("pubDate")

        authors = creator_el.text if creator_el is not None else "Unknown"
        description = desc_el.text if desc_el is not None else ""
        toc_url = extract_toc_url(description)
        pubdate = pubdate_el.text if pubdate_el is not None else ""

        # Shorten date
        pubdate_short = ""
        if pubdate:
            import re as re2
            m = re2.search(r'(\d+) (\w+) (\d+)', pubdate)
            if m:
                pubdate_short = f"{m.group(3)}/{m.group(2)}/{m.group(1)}"

        print(f"Processing: {title[:60]}...", file=sys.stderr)

        # Fetch abstract
        abstract = fetch_abstract(doi_url)

        # Download TOC image
        image_path = None
        if toc_url:
            safe_doi = doi.replace("/", "_")
            image_path = os.path.join(IMAGE_DIR, f"{safe_doi}.gif")
            if not download_toc_via_browser(toc_url, image_path):
                image_path = None

        paper = {
            "title": title,
            "title_ja": title,  # Will be translated by Blue in cron context
            "doi": doi,
            "authors": authors,
            "abstract": abstract,
            "summary_ja": abstract,  # Placeholder - Blue translates in cron
            "pubdate_short": pubdate_short,
            "tags": "",
        }

        if post_to_discord(paper, image_path):
            posted_dois.add(doi)
            posted_count += 1
            time.sleep(2)  # Rate limit

    save_posted_dois(posted_dois)
    print(f"\nDone. Posted {posted_count} papers.", file=sys.stderr)


if __name__ == "__main__":
    main()
