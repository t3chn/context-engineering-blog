# Blog Article Template

## Frontmatter

```yaml
---
title: "Article Title"
description: "SEO description in 1-2 sentences. Keywords: context engineering, LLM."
date: YYYY-MM-DD
tags: ["context-engineering", "topic"]
lang: ru
---
```

## Article Structure

```markdown
## Problem

[Specific pain point or observation. What's not working? What pattern did you notice?
1-2 paragraphs.]

## Context

[Why is it important? Why is it hard? What are the constraints?
1-3 paragraphs. Can include examples.]

## Solution

[Practical approach. How to solve it? What pattern to use?
Code examples if appropriate. 2-4 paragraphs.]

## Insight

[What changed in understanding? How does it change the approach?
1-2 paragraphs.]

## Sources

- [Source title](url)
```

## Ready Article Example

```markdown
---
title: "Context Engineering: First Steps"
description: "Introduction to context engineering — an approach to structuring information for LLMs. Practical insights from first experiments."
date: 2024-12-20
tags: ["context-engineering", "llm", "anthropic"]
lang: ru
---

## Problem

Prompts stopped working reliably. The same prompt gives different results depending on context. Adding details to instructions only makes things worse.

## Context

Prompt engineering focuses on formulating the request. But the model makes decisions based on the entire context: system prompt, history, documents.

Context engineering is an engineering approach to organizing all this information:
- What to include in context
- In what order
- How to structure it

It's like the difference between "write a good letter" and "build a communication system."

## Solution

Instead of improving the prompt — structure the context:

1. **Instructions** — brief, no repetition
2. **Data** — relevant, with metadata
3. **Examples** — specific, not abstract
4. **Constraints** — explicit limitations

Order matters: the model "forgets" the beginning of long context.
Critical information — at the beginning and end.

## Insight

Context engineering isn't about LLMs. It's about organizing information.
The same principles work for humans: structure helps understanding.

The difference: LLMs have no "common sense" to fill gaps.
Everything must be explicit.

## Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic: Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
```
