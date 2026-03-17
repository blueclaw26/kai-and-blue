#!/usr/bin/env python3
"""
Nature Paper Fetcher
- Fetches latest papers from Nature RSS feed
- Extracts title, link, DOI, description
- Outputs JSON for Discord posting
- Blue selects papers based on Kai's interests
"""

import json
import re
import sys
import os
import html

try:
    import feedparser
except ImportError:
    print("Installing feedparser...", file=sys.stderr)
    os.system(f"{sys.executable} -m pip install --break-system-packages feedparser -q")
    import feedparser

FEED_URL = "https://www.nature.com/nature.rss"
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "posted_dois_nature.json")

def load_posted_dois():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return set(json.load(f))
    return set()

def save_posted_dois(dois):
    with open(STATE_FILE, "w") as f:
        json.dump(list(dois), f, indent=2)

def extract_doi(link):
    """Extract DOI from Nature article URL."""
    match = re.search(r'articles/(s\d+-\d+-\d+-\w+|d\d+-\d+-\d+-\w+)', link)
    if match:
        return match.group(1)
    return link

def main():
    max_papers = int(sys.argv[1]) if len(sys.argv) > 1 else 10

    print("Fetching Nature RSS feed...", file=sys.stderr)
    feed = feedparser.parse(FEED_URL)
    
    if not feed.entries:
        print("No entries found in feed.", file=sys.stderr)
        print("[]")
        return

    posted_dois = load_posted_dois()
    papers = []

    for entry in feed.entries:
        title = entry.get("title", "")
        link = entry.get("link", "")
        doi_id = extract_doi(link)
        
        # Skip already posted
        if doi_id in posted_dois:
            continue
        
        # Skip news/editorial items (d41586 prefix = news, s41586 = research)
        # Include both but mark type
        is_research = "s41586" in link
        
        description = entry.get("description", entry.get("summary", ""))
        # Clean HTML from description
        description = re.sub(r'<[^>]+>', '', description).strip()
        description = html.unescape(description)
        
        authors = entry.get("author", "")
        pubdate = entry.get("published", "")
        
        papers.append({
            "title": title,
            "doi_id": doi_id,
            "link": link,
            "description": description,
            "authors": authors,
            "pubdate": pubdate,
            "is_research": is_research,
        })

        if len(papers) >= max_papers:
            break

    # Update posted DOIs
    new_dois = posted_dois | {p["doi_id"] for p in papers}
    save_posted_dois(new_dois)

    print(f"Found {len(papers)} new papers.", file=sys.stderr)
    print(json.dumps(papers, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
