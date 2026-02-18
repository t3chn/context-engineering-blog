# NLWeb + Cloudflare AutoRAG for ctxt.dev

> Research date: 2026-02-18 | Beads: context-engineering-blog-5qj

## TL;DR

**AutoRAG + NLWeb template** — clear winner for ctxt.dev. One-click setup, zero infra, free tier covers 16 posts. Provides `/ask` (chat) and `/mcp` (agent API) endpoints automatically.

## NLWeb (Microsoft / R.V. Guha)

Open protocol + Python reference implementation. Adds `/ask` and `/mcp` to any website.

- **GitHub**: https://github.com/nlweb-ai/NLWeb (6.1k stars, MIT)
- **Architecture**: content ingestion (RSS/sitemap) → vector store → LLM retrieval → JSON response (Schema.org vocabulary)
- **Deployment**: Python server on VPS/Docker/Azure. NOT natively on CF Workers
- **Maturity**: Beta, launched May 2025 at Microsoft Build

## Cloudflare AutoRAG / AI Search + NLWeb Template

Fully managed RAG pipeline. "NLWeb Website" template = AutoRAG indexing + Worker implementing NLWeb protocol.

- **Docs**: https://developers.cloudflare.com/ai-search/
- **NLWeb template**: https://developers.cloudflare.com/autorag/how-to/nlweb/
- **Setup**: Dashboard → AI Search → Create → "NLWeb Website" → select domain → Start indexing
- **What gets deployed**: `/ask`, `/mcp`, `/snippet.html` (embeddable chat widget)
- **Maturity**: Open beta (April 2025). NLWeb template is "public preview"

### Pricing (hobby scale = free)

| Service    | Free Tier                       | Paid              |
| ---------- | ------------------------------- | ----------------- |
| AI Search  | Free (beta)                     | TBD               |
| Vectorize  | 5M stored + 30M queried dims/mo | $0.01/M queried   |
| Workers AI | 10K neurons/day                 | $0.011/1K neurons |
| R2         | 10 GB                           | $0.015/GB-month   |

16-post blog fits entirely in free tiers.

### Limits

- 10 AI Search instances per account
- 100K pages per instance
- 4 MB max file size

## Comparison

| Dimension         | NLWeb self-hosted                 | AutoRAG + NLWeb template    |
| ----------------- | --------------------------------- | --------------------------- |
| Setup effort      | High (Python, vector DB, hosting) | Very low (dashboard clicks) |
| Infra to maintain | Python server + vector store      | Zero                        |
| Cost at scale     | VPS + LLM API                     | Near-zero (free tier)       |
| Customizability   | Full                              | Limited (Worker source)     |
| Production SLA    | No                                | No (public preview)         |

## Recommendation

AutoRAG + NLWeb template for ctxt.dev:

1. Site already on Cloudflare (Pages, DNS)
2. `@astrojs/sitemap` already generates `sitemap-index.xml`
3. 16 posts = free tier
4. `/ask` + `/mcp` auto-deployed, no code

## Setup Steps (when ready)

1. Verify `sitemap-index.xml` at `ctxt.dev/sitemap-index.xml`
2. Dashboard → Compute & AI → AI Search → Create → "NLWeb Website" → select `ctxt.dev`
3. Assign `ask.ctxt.dev` as custom domain on the Worker
4. Embed `snippet.html` in Astro layout for on-site chat widget

## Caveats

- **Public preview** — no SLA, pricing may change post-beta
- **Separate subdomain** — Worker lives at `ask.ctxt.dev`, not inside Pages
- **Multilingual** — default embedding model may handle RU poorly; needs testing
- **Hallucinations** — grounding reduces risk but doesn't eliminate it

## Sources

- [NLWeb GitHub](https://github.com/nlweb-ai/NLWeb)
- [CF blog: NLWeb + AutoRAG](https://blog.cloudflare.com/conversational-search-with-nlweb-and-autorag/)
- [CF AI Search docs](https://developers.cloudflare.com/ai-search/)
- [CF AutoRAG NLWeb guide](https://developers.cloudflare.com/autorag/how-to/nlweb/)
- [AI Search pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)
- [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
