"""Shared article parsing utilities for cross-posting scripts."""

from __future__ import annotations

import json
import os
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ArticleData:
    title: str
    description: str
    date: str          # YYYY-MM-DD string
    tags: list[str]
    lang: str
    slug: str
    body: str
    canonical_url: str
    # Optional platform IDs (from frontmatter if already published)
    devto_id: int | None = None
    devto_url: str | None = None
    hashnode_id: str | None = None
    hashnode_url: str | None = None
    # raw frontmatter dict for any additional fields
    frontmatter: dict = field(default_factory=dict)


def _parse_frontmatter_block(block: str) -> dict:
    """Parse a simple YAML frontmatter block without PyYAML.

    Handles:
    - Scalar values: key: value
    - Quoted strings: key: "value" or key: 'value'
    - Inline JSON arrays: tags: ["a", "b"]
    - Multiline list: tags:\n  - a\n  - b
    - date: 2025-12-20 (kept as string)
    """
    result: dict = {}
    lines = block.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
        # Match key: value
        match = re.match(r'^(\w[\w\-]*)\s*:\s*(.*)', line)
        if not match:
            i += 1
            continue
        key = match.group(1)
        raw_value = match.group(2).strip()

        # Inline list: starts with [
        if raw_value.startswith('['):
            try:
                result[key] = json.loads(raw_value)
            except json.JSONDecodeError:
                result[key] = raw_value
            i += 1
            continue

        # No value on this line — check for multiline list
        if raw_value == '':
            items = []
            i += 1
            while i < len(lines):
                sub = lines[i]
                # List item: starts with optional whitespace + -
                if re.match(r'^\s+-\s+', sub):
                    item = re.sub(r'^\s+-\s+', '', sub).strip()
                    item = _strip_quotes(item)
                    items.append(item)
                    i += 1
                else:
                    break
            result[key] = items
            continue

        # Quoted string
        if (raw_value.startswith('"') and raw_value.endswith('"')) or \
           (raw_value.startswith("'") and raw_value.endswith("'")):
            result[key] = raw_value[1:-1]
            i += 1
            continue

        # Try integer
        try:
            result[key] = int(raw_value)
            i += 1
            continue
        except ValueError:
            pass

        # Plain string
        result[key] = raw_value
        i += 1

    return result


def _strip_quotes(s: str) -> str:
    """Strip surrounding single or double quotes from a string."""
    if len(s) >= 2:
        if (s.startswith('"') and s.endswith('"')) or \
           (s.startswith("'") and s.endswith("'")):
            return s[1:-1]
    return s


def parse_article(path: str) -> ArticleData:
    """Parse a Markdown article with YAML frontmatter.

    Args:
        path: Path to the .md file (absolute or relative to cwd).

    Returns:
        ArticleData with all parsed fields populated.
    """
    filepath = Path(path)
    content = filepath.read_text(encoding='utf-8')

    # Split on --- delimiters
    # File must start with ---
    if not content.startswith('---'):
        raise ValueError(f"File does not start with frontmatter delimiter: {path}")

    # Find the second ---
    # content[3:] skips the opening ---
    rest = content[3:]
    end_idx = rest.find('\n---')
    if end_idx == -1:
        raise ValueError(f"No closing --- found in frontmatter: {path}")

    fm_block = rest[:end_idx].strip()
    body = rest[end_idx + 4:].lstrip('\n')  # skip \n---

    fm = _parse_frontmatter_block(fm_block)

    slug = filepath.stem  # filename without .md
    lang = str(fm.get('lang', 'en'))
    canonical_url = f"https://ctxt.dev/posts/{lang}/{slug}"

    # Normalize date to string
    date_val = fm.get('date', '')
    date_str = str(date_val)

    tags = fm.get('tags', [])
    if not isinstance(tags, list):
        tags = [str(tags)]

    devto_id_raw = fm.get('devto_id')
    devto_id = int(devto_id_raw) if devto_id_raw is not None else None

    return ArticleData(
        title=str(fm.get('title', '')),
        description=str(fm.get('description', '')),
        date=date_str,
        tags=tags,
        lang=lang,
        slug=slug,
        body=body,
        canonical_url=canonical_url,
        devto_id=devto_id,
        devto_url=fm.get('devto_url') or None,
        hashnode_id=fm.get('hashnode_id') or None,
        hashnode_url=fm.get('hashnode_url') or None,
        frontmatter=fm,
    )


def update_frontmatter(path: str, updates: dict) -> None:
    """Atomically update specific frontmatter keys in a Markdown file.

    Reads the file, updates the specified keys in the frontmatter block,
    then writes atomically via a temp file + os.replace().

    Args:
        path: Path to the .md file.
        updates: Dict of key-value pairs to set/update in frontmatter.
    """
    filepath = Path(path)
    content = filepath.read_text(encoding='utf-8')

    if not content.startswith('---'):
        raise ValueError(f"File does not start with frontmatter delimiter: {path}")

    rest = content[3:]
    end_idx = rest.find('\n---')
    if end_idx == -1:
        raise ValueError(f"No closing --- found in frontmatter: {path}")

    fm_block = rest[:end_idx]
    body_part = rest[end_idx + 4:]  # everything after \n---

    # Parse existing frontmatter lines preserving order
    fm_lines = fm_block.splitlines()

    # Track which update keys have been set
    updated_keys = set()
    new_fm_lines = []

    i = 0
    while i < len(fm_lines):
        line = fm_lines[i]
        match = re.match(r'^(\w[\w\-]*)\s*:', line)
        if match:
            key = match.group(1)
            if key in updates:
                # Replace this line with the new value
                new_fm_lines.append(_format_fm_line(key, updates[key]))
                updated_keys.add(key)
                # Skip any continuation lines (multiline list)
                i += 1
                while i < len(fm_lines) and re.match(r'^\s+-', fm_lines[i]):
                    i += 1
                continue
        new_fm_lines.append(line)
        i += 1

    # Append any new keys not already present
    for key, value in updates.items():
        if key not in updated_keys:
            new_fm_lines.append(_format_fm_line(key, value))

    new_content = '---\n' + '\n'.join(new_fm_lines) + '\n---' + body_part

    # Atomic write: temp file in same directory, then os.replace
    dirpath = filepath.parent
    with tempfile.NamedTemporaryFile(
        mode='w',
        encoding='utf-8',
        dir=dirpath,
        delete=False,
        suffix='.tmp'
    ) as tmp:
        tmp.write(new_content)
        tmp_name = tmp.name

    os.replace(tmp_name, str(filepath))


def _format_fm_line(key: str, value: object) -> str:
    """Format a frontmatter key-value pair as a YAML line."""
    if isinstance(value, list):
        items_json = json.dumps(value)
        return f"{key}: {items_json}"
    if isinstance(value, int):
        return f"{key}: {value}"
    if isinstance(value, str):
        # Quote if contains special chars
        if any(c in value for c in [':', '#', '[', ']', '{', '}']):
            escaped = value.replace('"', '\\"')
            return f'{key}: "{escaped}"'
        return f"{key}: {value}"
    return f"{key}: {value}"


def rewrite_image_paths(body: str, base_url: str) -> str:
    """Rewrite relative image paths in Markdown to absolute URLs.

    Handles:
    - ./images/foo.png  →  {base_url}/images/foo.png
    - /images/bar.png   →  https://ctxt.dev/images/bar.png

    Args:
        body: Markdown body text.
        base_url: Canonical URL of the article (e.g. https://ctxt.dev/posts/en/hello-world).

    Returns:
        Body with rewritten image paths.
    """
    # Relative paths starting with ./
    def replace_relative(m: re.Match) -> str:
        alt = m.group(1)
        img_path = m.group(2)
        # Remove leading ./
        img_path = re.sub(r'^\./', '', img_path)
        return f'![{alt}]({base_url}/{img_path})'

    body = re.sub(r'!\[([^\]]*)\]\(\./([^)]+)\)', replace_relative, body)

    # Root-relative paths starting with /
    # Extract domain from base_url
    domain_match = re.match(r'(https?://[^/]+)', base_url)
    domain = domain_match.group(1) if domain_match else 'https://ctxt.dev'

    def replace_root_relative(m: re.Match) -> str:
        alt = m.group(1)
        img_path = m.group(2)
        return f'![{alt}]({domain}{img_path})'

    body = re.sub(r'!\[([^\]]*)\]\((/[^)]+)\)', replace_root_relative, body)

    return body


def slugify_tag(tag: str) -> str:
    """Convert a tag string to lowercase-hyphenated slug form.

    Examples:
        'Context Engineering' -> 'context-engineering'
        'LLM' -> 'llm'
        'claude-code' -> 'claude-code'
    """
    slug = tag.lower()
    # Replace whitespace and underscores with hyphens
    slug = re.sub(r'[\s_]+', '-', slug)
    # Remove characters that are not alphanumeric or hyphens
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    # Collapse multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug
