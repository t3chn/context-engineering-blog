"""Publish or update a blog article on dev.to.

Usage:
    python3 scripts/publish_devto.py <article_path> [--dry-run]

Environment variables:
    DEVTO_API_KEY  — dev.to API key (required)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# Allow running from repo root: python3 scripts/publish_devto.py ...
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.shared.article import parse_article, slugify_tag, rewrite_image_paths, update_frontmatter

DEVTO_API_BASE = "https://dev.to/api"
MAX_TAGS = 4
# Dev.to/Forem rejects urllib's default Python user agent with HTTP 403.
# Publishing also stays in draft mode unless `published` is explicit.
DEVTO_API_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/vnd.forem.api-v1+json",
    "User-Agent": "context-engineering-blog/0.1 (+https://ctxt.dev)",
}


def build_payload(article) -> dict:
    tags = [slugify_tag(t) for t in article.tags][:MAX_TAGS]
    body_with_abs_images = rewrite_image_paths(article.body, article.canonical_url)
    return {
        "article": {
            "title": article.title,
            "slug": article.slug,
            "body_markdown": body_with_abs_images,
            "published": True,
            "tags": tags,
            "canonical_url": article.canonical_url,
            "description": article.description,
        }
    }


def publish(article, payload: dict, api_key: str) -> dict:
    """POST or PUT to dev.to API. Returns parsed JSON response."""
    if article.devto_id is not None:
        url = f"{DEVTO_API_BASE}/articles/{article.devto_id}"
        method = "PUT"
    else:
        url = f"{DEVTO_API_BASE}/articles"
        method = "POST"

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"api-key": api_key, **DEVTO_API_HEADERS},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"Error: HTTP {e.code} from dev.to: {body}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Publish a blog article to dev.to"
    )
    parser.add_argument("article_path", help="Path to the .md article file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be sent without making the API call",
    )
    args = parser.parse_args()

    api_key = os.environ.get("DEVTO_API_KEY")
    if not api_key:
        print("Error: DEVTO_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    article = parse_article(args.article_path)
    payload = build_payload(article)

    if args.dry_run:
        action = "PUT" if article.devto_id else "POST"
        target = (
            f"{DEVTO_API_BASE}/articles/{article.devto_id}"
            if article.devto_id
            else f"{DEVTO_API_BASE}/articles"
        )
        print(f"[dry-run] Would {action} {target}")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    result = publish(article, payload, api_key)

    devto_id = result.get("id")
    devto_url = result.get("url")

    if devto_id and devto_url:
        update_frontmatter(args.article_path, {
            "devto_id": int(devto_id),
            "devto_url": devto_url,
        })
        print(f"Published to dev.to: {devto_url} (id={devto_id})")
    else:
        print(f"Published, but could not extract id/url from response: {result}")


if __name__ == "__main__":
    main()
