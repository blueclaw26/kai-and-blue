#!/usr/bin/env python3
"""
Science Paper Fetcher
- Fetches latest papers from Science RSS feed
- Extracts title, link, DOI, description, authors
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

FEED_URL = "https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science"
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "posted_dois_science.json")

def load_posted_dois():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return set(json.load(f))
    return set()

def save_posted_dois(dois):
    with open(STATE_FILE, "w") as f:
        json.dump(sorted(list(dois)), f, indent=2)

def main():
    max_papers = int(sys.argv[1]) if len(sys.argv) > 1 else 10

    print("Fetching Science RSS feed...", file=sys.stderr)
    feed = feedparser.parse(FEED_URL)

    if not feed.entries:
        print("No entries found in feed.", file=sys.stderr)
        print("[]")
        return

    posted_dois = load_posted_dois()
    papers = []

    for entry in feed.entries:
        doi = entry.get("prism_doi", "")
        if not doi:
            continue

        # Skip already posted
        if doi in posted_dois:
            continue

        title = entry.get("title", "")
        link = entry.get("link", "")
        dc_type = entry.get("dc_type", "")
        authors = entry.get("author", "")
        cover_date = entry.get("prism_coverdate", "")

        # Description from summary (clean HTML)
        description = entry.get("summary", entry.get("description", ""))
        description = re.sub(r'<[^>]+>', '', description).strip()
        description = html.unescape(description)

        # Classify: Research Article, Report, Review, Editorial, etc.
        is_research = dc_type in ("Research Article", "Report", "Review")

        papers.append({
            "title": title,
            "doi": doi,
            "link": link,
            "description": description,
            "authors": authors,
            "cover_date": cover_date,
            "dc_type": dc_type,
            "is_research": is_research,
        })

        if len(papers) >= max_papers:
            break

    # Update posted DOIs
    new_dois = posted_dois | {p["doi"] for p in papers}
    save_posted_dois(new_dois)

    print(f"Found {len(papers)} new papers.", file=sys.stderr)
    print(json.dumps(papers, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
