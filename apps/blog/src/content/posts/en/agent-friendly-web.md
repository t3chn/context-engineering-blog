---
title: "Agent-friendly web: context engineering at internet scale"
description: "How content format determines whether an AI agent can see your site. Research data, real standards, and what to do right now."
date: 2026-02-18
tags: ["context-engineering", "agents", "web", "standards"]
lang: en
---

## Problem

AI agents are the new readers of the web. GPTBot grew 305% in a year. AI crawlers generate traffic comparable to Google. But most websites are built as if their only consumers are humans with browsers.

The result: on the WebArena benchmark, the best GPT-4 agent solves 14.4% of tasks on real websites. Humans hit 78%. Agents choke on HTML, get lost in JavaScript rendering, and can't extract structure from visual noise.

This isn't a model problem. It's a content problem.

## Context

The same blog post: 16,180 tokens in HTML, 3,150 in Markdown. A 5x difference. For an agent paying per token with a limited context window, that's the difference between "I can see it" and "it doesn't fit."

But it's not just about size. The HtmlRAG study (WWW 2025) found something unexpected: HTML with semantic tags (`<h2>`, `<table>`, `<code>`) outperforms plain text in RAG systems. Converting to plain text destroys structural information that helps models navigate. Not "more text" — "better structure."

Another surprise: content format changes model accuracy by up to 40%. GPT-3.5 prefers JSON, GPT-4 prefers Markdown. There's no universal "best" format — there's the right format for a specific model and task.

This is literally context engineering. The same principles we apply to prompts — structure over volume, format affects output quality, semantics beat raw data — now need to be applied to web content.

And the world has noticed. In 2025, agent-web standardization exploded: IETF created the AIPREF working group for AI preferences in HTTP headers. W3C launched three Community Groups on agent protocols. The Linux Foundation established the Agentic AI Foundation with AWS, Anthropic, Google, Microsoft, and OpenAI.

## Solution

### Accessibility = Agent-friendliness

The most unexpected finding. Agents working through the accessibility tree (semantic HTML, ARIA labels) successfully complete ~85% of tasks. Screenshot-based agents manage ~50%.

The same investment pays twice: the site becomes more accessible for people with disabilities and simultaneously more readable for AI agents. Semantic tags `<nav>`, `<main>`, `<article>`, `<aside>` aren't formalities — they're navigation for machines.

### What actually affects AI citation rates

SE Ranking analyzed 129,000 domains. Results:

**Works:**

- Backlink profile — strongest predictor. 32K+ referring domains = 2x citations
- Freshness — updated within 3 months gives 1.7x more citations
- Speed — FCP < 0.4s: +87% citations
- Length — articles over 2,900 words: 5.1 citations vs 3.2 for short ones
- Statistics in text: +22%. Source references: +37%

**Doesn't work:**

- FAQ Schema — near-zero or negative effect
- llms.txt — no major AI provider confirmed reading it (as of August 2025)
- Keyword-optimized URLs — irrelevant

87% of ChatGPT citations match Bing's top 10. Perplexity and ChatGPT overlap only 11% — platforms pull from different sources. There's no single strategy.

### The agent-friendly site stack in 2026

**Minimum (do today):**

- Schema.org/JSON-LD (`BlogPosting`) — confirmed effect: +73% selection in AI Overviews
- Semantic HTML + ARIA — accessibility = agent-friendliness
- Cloudflare Markdown for Agents — one toggle in the Dashboard
- robots.txt — explicitly allow GPTBot, ClaudeBot, PerplexityBot
- Explicit `datePublished` / `dateModified` — LLMs systematically prefer "fresh" content

**Medium horizon:**

- NLWeb + Cloudflare AutoRAG — `/ask` and `/mcp` endpoints with no code
- Content negotiation (`Accept: text/markdown`) — agents already request this
- MCP server for the site — via Cloudflare AI Index or custom

**Watch:**

- WebMCP (`navigator.modelContext`) — Google/Microsoft pushing through W3C. Lets sites publish "tools" for agents via a browser API. Early Preview in Chrome 146
- IETF AIPREF — official standard for AI preferences in HTTP headers. Deadline: August 2026
- AGENTS.md — open format for AI agent instructions in repositories. 60K+ projects, donated to Linux Foundation

### Tools for content preparation

Agents need clean content. An entire industry has emerged around conversion:

- **Firecrawl** — any URL to Markdown/JSON, MCP server, Claude integration
- **Jina Reader** — `r.jina.ai/{URL}` → Markdown, zero configuration
- **Crawl4AI** — open-source Python crawler for RAG pipelines

For AI visibility monitoring: Otterly.ai (6 platforms), Profound ($20M seed), free LLM Clicks AI Readiness Checker.

## Insight

The agent-friendly web isn't a separate discipline. It's context engineering turned inside out.

When we write a prompt, we structure context for one model. When we make a site agent-friendly, we structure content for thousands of models and agents simultaneously. Same principles: structure matters more than volume, semantics matter more than visuals, format determines answer quality.

The historical irony: the Semantic Web (RDF, OWL, Schema.org) tried to do this 20 years ago. There was no client that valued it. Now the client has arrived — the LLM. And Schema.org's creator R.V. Guha is building NLWeb, closing the circle.

The web is being rebuilt. Not through revolution — through content negotiation, HTTP headers, and /.well-known files. Quietly, at the protocol level. Those who structure their content now will get the traffic. Everyone else will become invisible to a new class of readers.

## Sources

- [WebArena — ICLR 2024](https://arxiv.org/abs/2307.13854)
- [HtmlRAG — WWW 2025](https://arxiv.org/abs/2411.02959)
- [Does Prompt Formatting Have Any Impact on LLM Performance?](https://arxiv.org/abs/2411.10541)
- [Accessibility & AI Agents](https://www.accessibility.works/blog/do-accessible-websites-perform-better-for-ai-agents/)
- [SE Ranking: Top 20 Factors Influencing ChatGPT Citations](https://www.searchenginejournal.com/new-data-top-factors-influencing-chatgpt-citations/561954/)
- [Seer Interactive: 87% of ChatGPT Citations Match Bing](https://www.seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results)
- [BrightEdge: Structured Data in AI Search](https://www.brightedge.com/blog/structured-data-ai-search-era)
- [Cloudflare: GPTBot +305%](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/)
- [WebMCP — W3C](https://webmcp.link/)
- [IETF AIPREF WG](https://datatracker.ietf.org/wg/aipref/about/)
- [AAIF — Linux Foundation](https://aaif.io/)
- [Build the Web for Agents, Not Agents for the Web](https://arxiv.org/abs/2506.10953)
