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

  # ============================================
  # EDITORIAL CHECKS (like publishing house QA)
  # ============================================

  # 1. Double spaces (outside code blocks)
  # Extract non-code content for text checks
  TEXT_CONTENT=$(echo "$CONTENT" | awk '
    /^```/ { in_code = !in_code; next }
    !in_code { print }
  ')

  DOUBLE_SPACES=$(echo "$TEXT_CONTENT" | grep -n '  ' | grep -v '^[0-9]*:$' | head -3 || true)
  if [ -n "$DOUBLE_SPACES" ]; then
    log_warn "$file: Double spaces found (check manually)"
  fi

  # 2. Trailing whitespace
  TRAILING_WS=$(grep -n '[[:space:]]$' "$file" | head -3 || true)
  if [ -n "$TRAILING_WS" ]; then
    log_warn "$file: Trailing whitespace on some lines"
  fi

  # 3. Multiple consecutive empty lines (more than 2)
  if grep -qE '^$' "$file" && awk '/^$/{c++;if(c>2)exit 1}!/^$/{c=0}' "$file"; then
    : # OK
  else
    log_warn "$file: Multiple consecutive empty lines (>2)"
  fi

  # 4. Space before punctuation in Russian (common typo)
  if echo "$file" | grep -q '/ru/'; then
    SPACE_BEFORE_PUNCT=$(echo "$TEXT_CONTENT" | grep -En ' [.,!?:;]' | head -3 || true)
    if [ -n "$SPACE_BEFORE_PUNCT" ]; then
      log_warn "$file: Space before punctuation (typo?)"
    fi
  fi

  # ============================================
  # STYLE GUIDE CHECKS
  # ============================================

  # 5. Motivational/promotional phrases (forbidden)
  MOTIVATIONAL_RU='[Вв]ы сможете|[Лл]учший способ|[Сс]амый лучший|[Пп]росто сделай|[Оо]бязательно попробуй'
  MOTIVATIONAL_EN='[Yy]ou can do it|[Tt]he best way|[Jj]ust do|[Mm]ust try|[Aa]mazing|[Ii]ncredible'

  if echo "$TEXT_CONTENT" | grep -qE "$MOTIVATIONAL_RU"; then
    log_warn "$file: Contains motivational phrases (avoid per style guide)"
  fi
  if echo "$TEXT_CONTENT" | grep -qE "$MOTIVATIONAL_EN"; then
    log_warn "$file: Contains promotional phrases (avoid per style guide)"
  fi

  # 6. CTA phrases (forbidden)
  CTA_PATTERNS='[Пп]одпиши|[Сс]убскрайб|[Ss]ubscribe|[Ff]ollow me|[Чч]итай далее|[Rr]ead more|[Кк]ликни|[Cc]lick here'
  if echo "$TEXT_CONTENT" | grep -qE "$CTA_PATTERNS"; then
    log_warn "$file: Contains CTA phrases (forbidden per style guide)"
  fi

  # 7. Excessive emoji (more than 3)
  # Use perl for proper unicode emoji detection
  EMOJI_COUNT=$(perl -CSD -ne 'print while /[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{1F600}-\x{1F64F}]/g' "$file" 2>/dev/null | wc -c | tr -d ' ' || echo "0")
  if [ "$EMOJI_COUNT" -gt 3 ]; then
    log_warn "$file: Too many emoji ($EMOJI_COUNT found, max 3 recommended)"
  fi

  # 8. Author signature at end (forbidden)
  LAST_LINES=$(echo "$CONTENT" | tail -5)
  if echo "$LAST_LINES" | grep -qiE '(—|--|^by |автор:|author:).*[A-Za-zА-Яа-я]'; then
    log_warn "$file: Possible author signature at end (forbidden)"
  fi

  # 9. Check for common typos
  COMMON_TYPOS='teh |hte |taht |контекст инженеринг|prompt инженеринг'
  TYPOS_FOUND=$(echo "$TEXT_CONTENT" | grep -iE "$COMMON_TYPOS" | head -2 || true)
  if [ -n "$TYPOS_FOUND" ]; then
    log_warn "$file: Possible typos found"
  fi

  # 10. Code block validation - check for lines starting with single space (not indentation)
  # Detects: " loadout" (bad) but not "  indented" (ok) or "loadout" (ok)
  CODE_ISSUES=$(echo "$CONTENT" | awk '
    /^```/ { in_code = !in_code; next }
    in_code && /^ [^ \t]/ { print NR": "$0 }
  ' | head -3 || true)
  if [ -n "$CODE_ISSUES" ]; then
    log_warn "$file: Code block lines may have unwanted leading space"
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
