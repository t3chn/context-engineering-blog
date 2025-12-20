---
name: ceb-content
description: |
  Content generation for Context Engineering Blog using Context-First Thinking style.
  Use when: creating Telegram posts (@ctxtdev), blog articles (RU/EN),
  editing or improving existing content about context engineering.
  Triggers: "telegram post", "blog article", "article", "post", "content",
  "context engineering", "write post", "generate article".
---

# Context Engineering Blog — Content Generation

## Loading Context

1. Read [references/TLDR.md](references/TLDR.md) — style essence
2. Load [references/INDEX.json](references/INDEX.json) and select sections by task:
   - `telegram_post` → core + telegram
   - `blog_ru` → core + blog_ru + template
   - `blog_en` → core + blog_en
3. Load examples from assets/ only if needed

## Philosophy: Context-First Thinking

Every post answers 4 questions:

| Stage | Question | Purpose |
|-------|----------|---------|
| **Problem** | What are we trying to solve? | Hook |
| **Context** | Why is it hard/important? | Depth |
| **Solution** | How to approach it? | Practice |
| **Insight** | What new understanding? | Value |

## Quick Start

### Telegram Post

```
[Problem — observation or pain point]

[Context — why it matters]

[Solution or approach]

[Insight — what changed in understanding]

#contextengineering #llm
```

### Blog Article

```markdown
---
title: "..."
description: "..."
date: YYYY-MM-DD
tags: ["context-engineering", "..."]
lang: ru
---

## Problem
...

## Context
...

## Solution
...

## Insight
...
```

## Checklists

### Pre-flight
- [ ] Specific problem defined?
- [ ] Context present (why it matters)?
- [ ] Practical solution?
- [ ] Insight included?

### Post-flight
- [ ] Telegram: plain text + minimal emoji?
- [ ] Hashtags at the end?
- [ ] No author signature?
- [ ] No motivational tone?

## Platforms

Detailed rules:
- Telegram: [references/TELEGRAM.md](references/TELEGRAM.md)
- Blog RU: [references/BLOG_RU.md](references/BLOG_RU.md)
- Blog EN: [references/BLOG_EN.md](references/BLOG_EN.md)

## Prohibited

- Excessive emoji (max 1-2 per post)
- Author signature
- CTA ("subscribe", "read more")
- Motivational tone
- Bullet lists in Telegram (visual noise)
