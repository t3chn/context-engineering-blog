#!/bin/bash
# Validate blog posts before commit
# Checks: date validity, required frontmatter, lang matches directory

set -e

POSTS_DIR="apps/blog/src/content/posts"
CURRENT_YEAR=$(date +%Y)
ERRORS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

log_error() {
  echo -e "${RED}❌ $1${NC}"
  ERRORS=$((ERRORS + 1))
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_ok() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Get staged markdown files in posts directory
STAGED_POSTS=$(git diff --cached --name-only --diff-filter=ACMR | grep -E "^${POSTS_DIR}/.*\.md$" || true)

if [ -z "$STAGED_POSTS" ]; then
  exit 0
fi

echo "📝 Validating blog posts..."

for file in $STAGED_POSTS; do
  echo ""
  echo "  Checking: $file"

  # Extract frontmatter (between --- markers)
  # Get content between first and second ---
  FRONTMATTER=$(awk '/^---$/{if(++c==1)next; if(c==2)exit}c==1' "$file")

  if [ -z "$FRONTMATTER" ]; then
    log_error "$file: Missing frontmatter"
    continue
  fi

  # Check required fields (trim whitespace)
  TITLE=$(echo "$FRONTMATTER" | grep -E '^title:' || true)
  DESCRIPTION=$(echo "$FRONTMATTER" | grep -E '^description:' || true)
  DATE=$(echo "$FRONTMATTER" | grep -E '^date:' | sed 's/date:[[:space:]]*//' | tr -d ' ' || true)
  TAGS=$(echo "$FRONTMATTER" | grep -E '^tags:' || true)
  LANG=$(echo "$FRONTMATTER" | grep -E '^lang:' | sed 's/lang:[[:space:]]*//' | tr -d ' ' || true)

  # Required fields check
  if [ -z "$TITLE" ]; then
    log_error "$file: Missing 'title' in frontmatter"
  fi

  if [ -z "$DESCRIPTION" ]; then
    log_error "$file: Missing 'description' in frontmatter"
  fi

  if [ -z "$DATE" ]; then
    log_error "$file: Missing 'date' in frontmatter"
  fi

  if [ -z "$TAGS" ]; then
    log_error "$file: Missing 'tags' in frontmatter"
  fi

  if [ -z "$LANG" ]; then
    log_error "$file: Missing 'lang' in frontmatter"
  fi

  # Date validation
  if [ -n "$DATE" ]; then
    # Extract year from date (format: YYYY-MM-DD)
    POST_YEAR=$(echo "$DATE" | grep -oE '^[0-9]{4}' || true)

    if [ -z "$POST_YEAR" ]; then
      log_error "$file: Invalid date format '$DATE' (expected YYYY-MM-DD)"
    else
      # Check year is reasonable (current year or last year, not future beyond current year)
      LAST_YEAR=$((CURRENT_YEAR - 1))

      if [ "$POST_YEAR" -lt "$LAST_YEAR" ]; then
        log_error "$file: Date year $POST_YEAR is too old (current year: $CURRENT_YEAR)"
      elif [ "$POST_YEAR" -gt "$CURRENT_YEAR" ]; then
        log_error "$file: Date year $POST_YEAR is in the future (current year: $CURRENT_YEAR)"
      fi

      # Validate date format more strictly
      if ! echo "$DATE" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
        log_error "$file: Invalid date format '$DATE' (expected YYYY-MM-DD)"
      fi
    fi
  fi

  # Lang matches directory
  if [ -n "$LANG" ]; then
    DIR_LANG=$(echo "$file" | grep -oE '/posts/(ru|en)/' | sed 's|/posts/||;s|/||')

    if [ -n "$DIR_LANG" ] && [ "$DIR_LANG" != "$LANG" ]; then
      log_error "$file: lang '$LANG' doesn't match directory '$DIR_LANG'"
    fi
  fi

  # Check for empty content (after frontmatter)
  CONTENT=$(awk '/^---$/{c++; next}c>=2' "$file")
  CONTENT_LENGTH=$(echo "$CONTENT" | tr -d '[:space:]' | wc -c | tr -d ' ')

  if [ "$CONTENT_LENGTH" -lt 100 ]; then
    log_error "$file: Content too short ($CONTENT_LENGTH chars, minimum 100)"
  fi

  # Check for common issues
  if echo "$CONTENT" | grep -qE '^\s*-\s+' | head -1 && echo "$file" | grep -q '/ru/'; then
    log_warn "$file: Contains bullet lists (avoid in Telegram-style posts)"
  fi
done

echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}🛑 Found $ERRORS error(s) in blog posts${NC}"
  echo "   Fix the issues or use: git commit --no-verify"
  exit 1
fi

log_ok "All blog posts valid"
exit 0
