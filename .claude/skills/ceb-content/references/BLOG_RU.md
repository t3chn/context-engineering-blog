# Blog Platform Guide — Russian

## Format

- Structured article with headers (## and ###)
- 500-1500 words
- Code examples where appropriate
- Source links

## Frontmatter

```yaml
---
title: "Article Title"
description: "SEO description, 1-2 sentences"
date: YYYY-MM-DD
tags: ["context-engineering", "topic"]
lang: ru
---
```

## Article Structure

```markdown
## Problem

Specific pain point or observation.
What's not working? What pattern did you notice?

## Context

Why is it important? Why is it hard?
What are the constraints?

## Solution

Practical approach. How to solve it?
Code examples if appropriate.

## Insight

What changed in understanding?
How does it change the approach?

## Sources

- [Title](url)
```

## Tone

- Technical, but accessible
- Deeper than Telegram, but no fluff
- With code examples where appropriate
- Links to sources

## Code Examples

````markdown
```typescript
// Example of good code with comments
const context = buildContext({
  files: getRelevantFiles(),
  schema: loadSchema(),
});
```
````

## Prohibited

- Motivational tone
- Clickbait headlines
- Author signature at the end
- Empty paragraphs ("Let's figure this out...")

## Pre-publication Checklist

- [ ] All 4 sections present (Problem, Context, Solution, Insight)?
- [ ] Frontmatter filled correctly?
- [ ] Code examples work?
- [ ] Links valid?
- [ ] No motivational tone?
