---
title: "Context Engineering: First Steps"
description: "Introduction to context engineering — an engineering approach to working with LLMs. Why prompts stop working and what to do about it."
date: 2025-12-20
tags: ["context-engineering", "llm", "intro"]
lang: en
---

## Problem

Prompts stopped working reliably.

The same prompt gives different results depending on context. Adding more details to instructions only makes things worse. The model "forgets" important things or focuses on the wrong parts.

## Context

Prompt engineering focuses on how you phrase the request. But the model makes decisions based on the entire context: system prompt, conversation history, documents, examples.

Context engineering is an engineering approach to organizing all this information:

- What to include in context
- In what order
- How to structure it

It's like the difference between "writing a good letter" and "building a communication system."

## Solution

Instead of improving the prompt — structure the context.

**Instructions** — brief, no repetition. The model doesn't need verbose explanations.

**Data** — relevant, with metadata. Not just text, but structure: what it is, where it's from, why it matters.

**Examples** — concrete, not abstract. One good example beats a page of explanations.

**Constraints** — explicit limits. What not to do is as important as what to do.

Order matters: models "forget" the middle of long contexts. Critical information goes at the beginning and end.

## Insight

Context engineering isn't about LLMs. It's about organizing information.

The same principles work for humans: structure aids understanding. The difference is that LLMs have no "common sense" to fill in gaps. Everything must be explicit.

This blog is an exploration of how to structure context. Practice, not theory.

## Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic: Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
