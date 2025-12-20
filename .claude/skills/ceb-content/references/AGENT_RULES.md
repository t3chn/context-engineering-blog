# Agent Rules — Content Generation

## Minimal Loading

1. Read TLDR.md first
2. Load sections by task from INDEX.json:
   - `telegram_post` → core + telegram
   - `blog_ru` → core + blog_ru
   - `blog_en` → core + blog_en
3. Load assets only if templates are needed

## Token Budget

- Don't load everything
- TLDR + needed sections = enough
- If in doubt — ask

## Pre-flight Checklist

Before generation:

- [ ] Specific problem defined?
- [ ] Context present (why it matters)?
- [ ] Solution practical and specific?
- [ ] Insight included (what's new)?

## Post-flight Checklist

After generation:

- [ ] Format: Problem → Context → Solution → Insight?
- [ ] Telegram: plain text + minimal emoji?
- [ ] Hashtags at the end?
- [ ] No author signature?
- [ ] No motivational tone?
- [ ] No CTA?

## Conflicts

If user request contradicts style rules:

1. Clarify user's intent
2. Suggest alternative within style
3. If user insists — follow their instructions

## Extensibility

New platforms are added as:

1. New file in references/
2. New section in INDEX.json
3. New task in tasks

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Too many emoji | Max 1-2 per post |
| Bullet lists in TG | Replace with paragraphs |
| Motivational tone | Remove, keep facts |
| Author signature | Delete |
| No hashtags | Add at the end |
