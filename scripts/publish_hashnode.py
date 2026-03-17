"""Publish or update a blog article on Hashnode via GraphQL.

Usage:
    python3 scripts/publish_hashnode.py <article_path> [--dry-run]

Environment variables:
    HASHNODE_TOKEN          — Hashnode personal access token (required)
    HASHNODE_PUBLICATION_ID — Hashnode publication ID (required)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.shared.article import parse_article, slugify_tag, rewrite_image_paths, update_frontmatter

HASHNODE_GQL_ENDPOINT = "https://gql.hashnode.com/"

PUBLISH_POST_MUTATION = """
mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post {
      id
      url
    }
  }
}
"""


def build_variables(article, publication_id: str) -> dict:
    tags = [
        {"name": t, "slug": slugify_tag(t)}
        for t in article.tags
    ]
    body_with_abs_images = rewrite_image_paths(article.body, article.canonical_url)
    return {
        "input": {
            "publicationId": publication_id,
            "title": article.title,
            "contentMarkdown": body_with_abs_images,
            "tags": tags,
            "originalArticleURL": article.canonical_url,
        }
    }


def gql_request(query: str, variables: dict, token: str) -> dict:
    """Execute a GraphQL request against Hashnode API."""
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        HASHNODE_GQL_ENDPOINT,
        data=payload,
        method="POST",
        headers={
            "Authorization": token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"Error: HTTP {e.code} from Hashnode: {body}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Publish a blog article to Hashnode"
    )
    parser.add_argument("article_path", help="Path to the .md article file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print GraphQL payload without posting",
    )
    args = parser.parse_args()

    token = os.environ.get("HASHNODE_TOKEN")
    if not token:
        print("Error: HASHNODE_TOKEN environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    publication_id = os.environ.get("HASHNODE_PUBLICATION_ID")
    if not publication_id:
        print("Error: HASHNODE_PUBLICATION_ID environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    article = parse_article(args.article_path)
    variables = build_variables(article, publication_id)

    if args.dry_run:
        print("[dry-run] Would POST to", HASHNODE_GQL_ENDPOINT)
        print("Query:", PUBLISH_POST_MUTATION.strip())
        print("Variables:", json.dumps(variables, indent=2, ensure_ascii=False))
        return

    result = gql_request(PUBLISH_POST_MUTATION, variables, token)

    errors = result.get("errors")
    if errors:
        print(f"GraphQL errors: {errors}", file=sys.stderr)
        sys.exit(1)

    post = result.get("data", {}).get("publishPost", {}).get("post", {})
    hashnode_id = post.get("id")
    hashnode_url = post.get("url")

    if hashnode_id and hashnode_url:
        update_frontmatter(args.article_path, {
            "hashnode_id": hashnode_id,
            "hashnode_url": hashnode_url,
        })
        print(f"Published to Hashnode: {hashnode_url} (id={hashnode_id})")
    else:
        print(f"Published, but could not extract id/url from response: {result}")


if __name__ == "__main__":
    main()
