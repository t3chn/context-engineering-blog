# Agent-Friendly контент: исследование подходов (февраль 2026)

Цель — понять как сделать веб-контент удобным для AI-агентов и какие стандарты/инструменты существуют.

## Зачем это нужно

- AI-трафик вырос на **527%** с января по май 2025; GPTBot вырос на **305%** за год ([Cloudflare](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/))
- AI-краулеры в топе user-agents: 21% из топ-1000 сайтов имеют правила для GPTBot в robots.txt
- HTML расточителен для LLM: один пост — 16,180 токенов в HTML vs 3,150 в Markdown (экономия 80%, payload 500 КБ vs 2 КБ)
- MCP SDK: 97 млн загрузок/месяц, 10,000+ активных серверов
- **Crawl-to-Click Gap**: Anthropic краулит в 25,000–100,000× больше, чем направляет трафика обратно ([Cloudflare](https://blog.cloudflare.com/crawlers-click-ai-bots-training/))
- **Zero-click кризис**: 60% поисковых запросов Google заканчиваются без клика; CTR при AI Overview падает до 8% (было 15%) ([Digital Bloom](https://thedigitalbloom.com/learn/2025-organic-traffic-crisis-analysis-report/))
- **Потери издателей**: Google search referrals для 2500+ новостных сайтов упали на **33%** в 2025 ([Chartbeat/AdExchanger](https://www.adexchanger.com/publishers/the-ai-search-reckoning-is-dismantling-open-web-traffic-and-publishers-may-never-recover/)); HubSpot -70-80%, Forbes -50%, CNN -27-38%
- **47%** поисковых запросов Google теперь содержат AI Overview; AI Overviews удвоились с 6.49% до 13.14% за 3 месяца ([Semrush](https://www.semrush.com/blog/semrush-ai-overviews-study/))

---

## Карта стандартов по уровням

### 1. Контроль доступа

| Что                          | Зрелость                                      | Ссылки                                                                                                                    |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **robots.txt для AI**        | Зрелый, массовое принятие                     | [Cloudflare: кто краулит ваш сайт](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/) |
| **Content-Signal заголовок** | Новый (Cloudflare, 2026)                      | [Cloudflare Docs](https://developers.cloudflare.com/fundamentals/reference/content-signal/)                               |
| **IETF AIPREF WG**           | Официальная рабочая группа IETF (январь 2025) | [datatracker](https://datatracker.ietf.org/wg/aipref/about/)                                                              |
| **ai.txt DSL**               | Академическое предложение (май 2025)          | [arxiv](https://arxiv.org/html/2505.07834v1)                                                                              |
| **AI-Disclosure заголовок**  | Internet-Draft (апрель 2025)                  | [datatracker](https://datatracker.ietf.org/doc/draft-abaris-aicdh/)                                                       |
| **IEEE 7012-2025 (MyTerms)** | Опубликован IEEE (январь 2026)                | [IEEE](https://ieeexplore.ieee.org/document/11360682)                                                                     |

Content-Signal — HTTP-заголовок, декларирующий разрешённые способы использования: `ai-train=yes, search=yes, ai-input=yes`.

**IETF AIPREF** — официальная рабочая группа IETF, стандартизирует словарь (`draft-ietf-aipref-vocab`) и HTTP-привязку (`draft-ietf-aipref-attach`) для машиночитаемых предпочтений по AI-использованию контента. Дедлайн — август 2026. Координируется с W3C и WHATWG.

**ai.txt** — DSL с 14 регулируемыми действиями (Train, Summarize, Analyze, Manipulate, Translate и др.) и элементоуровневой гранулярностью (HTML-элементы, JSON-объекты). Иерархический синтаксис: User-agent → Path → Element → Action.

**AI-Disclosure** — HTTP-заголовок для машиночитаемой пометки степени AI-генерации контента: `mode: none|ai-modified|ai-originated|machine-generated`, `model`, `provider`, `reviewed-by`.

**IEEE 7012** — «Creative Commons для приватности»: стандарт машиночитаемых требований к использованию данных для ИИ.

### 2. Обнаружение контента

| Что                         | Зрелость                                   | Ссылки                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **llms.txt**                | Предложение (2024), ~844K сайтов           | [llmstxt.org](https://llmstxt.org/)                                                                                                                                                                    |
| **Schema.org / JSON-LD**    | Зрелый (W3C), +73% выбор в AI Overview     | [Schema App](https://www.schemaapp.com/schema-markup/what-2025-revealed-about-ai-search-and-the-future-of-schema-markup/), [BrightEdge](https://www.brightedge.com/blog/structured-data-ai-search-era) |
| **OpenAPI 3.2**             | Зрелый                                     | [openapis.org](https://www.openapis.org/blog/2025/09/23/announcing-openapi-v3-2)                                                                                                                       |
| **AGENTS.md**               | Open Standard (август 2025), 60K+ проектов | [agents.md](https://agents.md/), [GitHub](https://github.com/agentsmd/agents.md)                                                                                                                       |
| **`/.well-known/mcp.json`** | Предложение SEP                            | [MCP Discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1147)                                                                                                        |
| **`/.well-known/awp.json`** | Internet-Draft (ноябрь 2025)               | [IETF](https://www.ietf.org/archive/id/draft-vinaysingh-awp-wellknown-00.html)                                                                                                                         |

**Важно о llms.txt**: ни один крупный AI-провайдер не подтвердил, что его читает ([Longato, август 2025](https://www.longato.ch/llms-recommendation-2025-august/)). SE Ranking: минимальная или отрицательная корреляция с цитатами. Но Google включил в A2A-протокол. Стоимость внедрения нулевая — делать стоит.

**Schema.org** — подтверждённый эффект. Google и Microsoft (март 2025) официально заявили об использовании в генеративных AI-функциях. Правильно размеченный контент показывает на **73%** более высокие показатели выбора в AI Overviews ([BrightEdge](https://www.brightedge.com/blog/structured-data-ai-search-era)). JSON-LD вырос с 34% до 41% веба за 2022–2024 ([Web Almanac 2024](https://almanac.httparchive.org/en/2024/structured-data)).

**AGENTS.md** — открытый формат от OpenAI: Markdown-файл в корне репозитория с инструкциями для AI-агентов. Cascading, как `.gitignore`. Принят Anthropic, Google, Microsoft, Cursor, Devin, Copilot. Донирован в Linux Foundation AAIF (декабрь 2025).

**AWP** — Agent Workflow Protocol: `/.well-known/awp.json` описывает типичные рабочие процессы сайта (состояния, действия, переходы), чтобы агенты действовали предсказуемо без скрейпинга.

### 3. Формат доставки

| Что                                               | Зрелость             | Ссылки                                                                                                                                          |
| ------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Markdown for Agents**                | Новый (февраль 2026) | [Блог](https://blog.cloudflare.com/markdown-for-agents/), [Docs](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) |
| **Content Negotiation** (`Accept: text/markdown`) | Стандарт (RFC 7231)  | [Vercel: agent-friendly pages](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation)                                    |

Агенты (Claude Code, OpenCode) уже отправляют `Accept: text/markdown`. Cloudflare автоматизирует конвертацию на CDN-уровне.

**Риск**: Google (John Mueller) считает это вариантом cloaking. Cloudflare контраргументирует: content negotiation — одинаковый контент в разном формате, не cloaking.

**Что говорит наука о форматах:**

- **HtmlRAG** (WWW 2025): HTML с тегами заголовков и таблиц превосходит plain text в RAG. Конверсия в plain text уничтожает структурную информацию. Нужен прунинг HTML, а не конверсия в text ([arxiv](https://arxiv.org/abs/2411.02959))
- **MDEval** (ACM Web Conference 2025): первый бенчмарк «Markdown Awareness» для LLM — 20K примеров, 10 тематик. Fine-tuning на MDEval позволяет open-source моделям достичь уровня GPT-4o ([arxiv](https://arxiv.org/abs/2501.15000))
- **Does Prompt Formatting Matter?**: формат подачи меняет точность GPT-3.5 до **40%**. GPT-3.5 предпочитает JSON, GPT-4 — Markdown. Нет универсального «лучшего» формата ([arxiv](https://arxiv.org/abs/2411.10541))
- **Beyond Pixels (D2Snap)**: семантически сжатый DOM (67% success) не хуже скриншотов (65%) при тех же токенах ([arxiv](https://arxiv.org/abs/2508.04412))

### 4. Программное взаимодействие

| Что                                       | Зрелость                                             | Ссылки                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MCP (Model Context Protocol)**          | Быстрорастущий, принят OpenAI/Anthropic/Google       | [modelcontextprotocol.io](https://modelcontextprotocol.io/)                                                                                                                                 |
| **NLWeb (Microsoft)**                     | Ранний (Build 2025)                                  | [Microsoft](https://news.microsoft.com/source/features/company-news/introducing-nlweb-bringing-conversational-interfaces-directly-to-the-web/), [GitHub](https://github.com/nlweb-ai/NLWeb) |
| **A2A Protocol (Google)**                 | Ранний (апрель 2025), 50+ партнёров                  | [Google Blog](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)                                                                                                |
| **WebMCP** (`navigator.modelContext`)     | W3C CG, Early Preview Chrome 146                     | [webmcp.link](https://webmcp.link/)                                                                                                                                                         |
| **AG-UI (Agent User Interface Protocol)** | Open Source (CopilotKit), поддержка Microsoft/Oracle | [docs.ag-ui.com](https://docs.ag-ui.com/introduction), [GitHub](https://github.com/ag-ui-protocol/ag-ui)                                                                                    |
| **A2UI (Google)**                         | Open Project (декабрь 2025)                          | [a2ui.org](https://a2ui.org/), [GitHub](https://github.com/google/A2UI)                                                                                                                     |
| **VOIX Framework**                        | Академический (2025)                                 | [arxiv](https://arxiv.org/abs/2511.11287)                                                                                                                                                   |
| **`agent://` URI**                        | Internet-Draft (октябрь 2025)                        | [IETF](https://datatracker.ietf.org/doc/draft-narvaneni-agent-uri/)                                                                                                                         |
| **`ai://` URI + AIIP**                    | Internet-Draft (октябрь 2025)                        | [IETF](https://www.ietf.org/archive/id/draft-sogomonian-ai-uri-scheme-01.html)                                                                                                              |

**MCP** — "USB для AI-агентов". Принят повсеместно: ChatGPT, Claude, Cursor, Gemini, VS Code, Copilot.

**NLWeb** — самый интересный для контент-сайтов. Создан R.V. Guha (автор RSS, RDF, Schema.org). Два endpoint: `/ask` (чат для людей) и `/mcp` (API для агентов). Cloudflare AutoRAG + NLWeb = one-click setup.

**A2A** — межагентное взаимодействие от Google. Обнаружение через `/.well-known/agent.json`.

**WebMCP** — браузерный API `navigator.modelContext`, позволяющий сайтам экспонировать структурированные инструменты для AI-агентов. Два подхода: декларативный (HTML form-based, без JS) и императивный (JavaScript). Агенты получают семантический доступ к возможностям сайта, а не к DOM. Early Preview в Chrome 146 (февраль 2026).

**AG-UI** — событийный протокол агент→фронтенд: 16 типов событий (токены, вызовы инструментов, патчи состояния UI). SSE/WebSocket. Отличие от A2A: это агент→пользователь, не агент→агент.

**A2UI** (Google) — декларативный JSONL-формат для генерации агентами нативных UI-виджетов. Агент описывает намерение интерфейса, приложение рендерит из одобренного каталога.

**VOIX** — фреймворк, вводящий HTML-теги `<tool>` и `<context>`, позволяя разработчикам явно описывать действия и состояние для агентов прямо в разметке. Проверен на хакатоне с 16 разработчиками ([arxiv](https://arxiv.org/abs/2511.11287)).

**URI-схемы** — два независимых IETF-черновика предлагают `agent://` и `ai://` для адресации агентов и AI-ресурсов. Включают well-known discovery (`/.well-known/agent.json`, `/.well-known/agents.json`).

### 5. Идентификация и аутентификация агентов

| Что                                | Зрелость                               | Ссылки                                                                                                                                                   |
| ---------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agentic JWT**                    | Internet-Draft (декабрь 2025)          | [IETF](https://datatracker.ietf.org/doc/draft-goswami-agentic-jwt/)                                                                                      |
| **OAuth On-Behalf-Of для агентов** | Internet-Draft (май 2025)              | [IETF](https://datatracker.ietf.org/doc/draft-oauth-ai-agents-on-behalf-of-user/)                                                                        |
| **SCIM для агентов**               | Internet-Drafts (2025), от Microsoft   | [Abbey](https://datatracker.ietf.org/doc/draft-abbey-scim-agent-extension/), [Wahl/MSFT](https://datatracker.ietf.org/doc/draft-wahl-scim-agent-schema/) |
| **did:wba (ANP)**                  | Open Source спецификация               | [ANP](https://agentnetworkprotocol.com/en/specs/03-did-wba-method-specification/)                                                                        |
| **C2PA 2.2**                       | Опубликован (май 2025), движется к ISO | [spec](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html)                                                                 |

**Agentic JWT** — расширение OAuth 2.0 с криптографическим ID агента: Agent Checksum (SHA-256 конфигурации: системный промпт + инструменты + параметры модели). Решает «drift» — расхождение намерения пользователя и действий автономного агента.

**SCIM для агентов** — управление жизненным циклом «цифровых сотрудников»: провизионирование, управление токенами, детектирование устаревшего доступа.

**did:wba** — новый DID-метод, позволяющий агентам разных платформ аутентифицировать друг друга криптографически без централизованного сервера.

**C2PA 2.2** — криптографический провенанс контента. Поле `digitalSourceType` помечает AI-генерацию. Поддержан Google, Adobe, Microsoft, BBC.

### 6. Монетизация

| Что                          | Зрелость          | Ссылки                                                 |
| ---------------------------- | ----------------- | ------------------------------------------------------ |
| **X402 Protocol**            | Экспериментальный | [TokenMinds](https://tokenminds.co/blog/x402-protocol) |
| **Cloudflare Pay Per Crawl** | Экспериментальный | [Cloudflare Blog](https://blog.cloudflare.com/)        |

Микроплатежи от $0.0001 через HTTP 402. IAB Tech Lab создал рабочую группу AI Content Monetization Protocols (CoMP).

---

## Инструменты экосистемы

### Web → Markdown/JSON для агентов

| Инструмент        | Что делает                                                                                                             | Ссылки                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Firecrawl**     | Любой сайт → чистый Markdown/JSON. JS-рендеринг, удаление шума. Официальный MCP-сервер. -67% токенов vs сырой HTML     | [firecrawl.dev](https://firecrawl.dev), [GitHub](https://github.com/firecrawl/firecrawl) |
| **Jina Reader**   | `r.jina.ai/{URL}` → Markdown. Своя SLM ReaderLM-v2 для конверсии. 100 млрд токенов/день. Куплен Elastic (октябрь 2025) | [jina.ai/reader](https://jina.ai/reader)                                                 |
| **Crawl4AI**      | Open-source Python-краулер для RAG. 6× быстрее традиционных методов. Без API-ключей                                    | [GitHub](https://github.com/unclecode/crawl4ai)                                          |
| **ScrapeGraphAI** | Schema-driven extraction: описываешь структуру → LLM сам извлекает                                                     | [GitHub](https://github.com/VinciGit00/Scrapegraph-ai)                                   |
| **Markdowner**    | Open-source микросервис на Cloudflare Workers: URL → Markdown за <1с                                                   | [GitHub](https://github.com/supermemoryai/markdowner)                                    |
| **IBM Docling**   | PDF/DOCX/HTML → Markdown/JSON. Модель Granite-Docling-258M. MCP-сервер                                                 | [docling.ai](https://docling.ai), [GitHub](https://github.com/docling-project/docling)   |

### Поисковые API для агентов

| Инструмент | Что делает                                                                                     | Ссылки                           |
| ---------- | ---------------------------------------------------------------------------------------------- | -------------------------------- |
| **Tavily** | Search API для RAG: структурированные результаты для LLM-контекста. Куплен Nebius за $275–400M | [tavily.com](https://tavily.com) |
| **Exa**    | Семантический поиск для машин (по смыслу, не по ключевым словам). $85M Series B. MCP-сервер    | [exa.ai](https://exa.ai)         |
| **Linkup** | Standard Search + Deep Search для агентов. $10M seed. MCP-сервер                               | [linkup.so](https://linkup.so)   |

### Инфраструктура браузерных агентов

| Инструмент                     | Что делает                                                                               | Ссылки                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Browserbase**                | Облачные headless-браузеры для агентов. $40M Series B. 50M сессий/2025. SOC-2/HIPAA      | [browserbase.com](https://browserbase.com)            |
| **Stagehand** (Browserbase)    | SDK: `act`, `extract`, `observe` на естественном языке. Интегрирован в Cloudflare        | [stagehand.dev](https://stagehand.dev)                |
| **Browser Use**                | Open-source Python: DOM-реструктуризация для LLM. 89.1% WebVoyager. 21k+ звёзд           | [browser-use.com](https://browser-use.com)            |
| **Playwright MCP** (Microsoft) | Официальный MCP-сервер: LLM управляет браузером через Playwright. В GitHub Copilot Agent | [GitHub](https://github.com/microsoft/playwright-mcp) |
| **Lightpanda**                 | Headless-браузер на Zig (не Chromium): 10× быстрее Chrome, 10× меньше памяти             | [lightpanda.io](https://lightpanda.io)                |
| **AgentQL**                    | Язык запросов: описываешь элементы на NL → AI находит в DOM. Self-healing                | [agentql.com](https://agentql.com)                    |

### CMS-платформы с agent-friendly фичами

| Платформа     | Что умеет                                                                                                              | Ссылки                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **WordPress** | Экосистема llms.txt плагинов: автогенерация, детекция AI-ботов, трекинг                                                | [llms-txt-generator](https://wordpress.org/plugins/llms-txt-generator/), [LLMagnet](https://wordpress.org/plugins/llmagnet-llm-txt-generator/) |
| **Astro**     | Плагины astro-llms-txt. Astro Docs сама публикует llms.txt + MCP-сервер                                                | [GitHub](https://github.com/4hse/astro-llms-txt), [Astro AI guide](https://docs.astro.build/en/guides/build-with-ai/)                          |
| **Sanity**    | Content Operations Agent: AI-агенты аудируют контент, заполняют пробелы, предлагают обновления через Agent Actions API | [sanity.io](https://sanity.io)                                                                                                                 |
| **Drupal**    | CMS 2.0: встроенные AI-агенты автономно создают типы контента, поля, таксономии                                        | [Drupal AI](https://new.drupal.org/docs/drupal-cms/get-to-know-drupal-cms/ai-tools-in-drupal-cms)                                              |

### CDN/Hosting с агентными фичами

| Платформа               | Что делает                                                                                                       | Ссылки                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Netlify**             | Agent Runners (Claude Code, Gemini, Codex прямо в Netlify). AI Gateway. Концепция Agent Experience (AX)          | [Netlify Docs](https://docs.netlify.com/build/build-with-ai/agent-runners/overview/)                                       |
| **Fastly**              | 29% трафика — AI-боты. AI Accelerator: -90% затрат на AI-приложения. Впервые прибыльна за счёт агентного трафика | [NetworkWorld](https://www.networkworld.com/article/4132262/ai-agent-traffic-drives-first-profitable-year-for-fastly.html) |
| **Adobe LLM Optimizer** | GEO на CDN-уровне без изменений CMS. AI-only delivery: изменённый HTML только для LLM user-agents                | [Adobe](https://business.adobe.com/products/llm-optimizer.html)                                                            |

### GEO-мониторинг: инструменты

| Инструмент                  | Что делает                                                                 | Ссылки                                                      |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Otterly.ai**              | Мониторинг 6 AI-платформ: ChatGPT, Perplexity, Google AIO, Gemini, Copilot | [otterly.ai](https://otterly.ai)                            |
| **Profound**                | Enterprise-мониторинг бренда в answer engines. $20M seed (июнь 2025)       | [tryprofound.com](https://tryprofound.com)                  |
| **AthenaHQ**                | GEO-платформа с Athena Citation Engine. 6 AI-платформ + Shopify            | [athenahq.ai](https://athenahq.ai)                          |
| **LLM Clicks AI Readiness** | Бесплатная проверка: entity density, schema, семантика                     | [llmclicks.ai](https://llmclicks.ai/ai-readiness-analyzer/) |

---

## Интерактивные AI-фичи для сайтов

### RAG-чатботы ("поговори с блогом")

**Hosted решения:**

- [Kapa.ai](https://www.kapa.ai/) — лидер для техдокументации (OpenAI, Docker, Mapbox, Prisma, Next.js)
- [ChatBase](https://www.chatbase.co/), [DocsBot](https://docsbot.ai/), [Mendable](https://www.mendable.ai/), [Inkeep](https://inkeep.com/)
- [Mintlify](https://mintlify.com/) — встроенный AI assistant в доксайтах

**Self-hosted:**

- [Vercel AI SDK RAG template](https://vercel.com/templates/next.js/ai-sdk-rag) (Next.js + pgvector)
- Supabase Vector + Next.js
- Weaviate (Docker) + любой фронтенд

### NLWeb + Cloudflare AutoRAG

Наиболее перспективная комбинация. One-click через Cloudflare Dashboard:

- Автоматический краулинг до 100K страниц
- Индексация в Vectorize
- Деплой Worker с `/ask` и `/mcp` endpoint
- Без кода

### Браузерные AI-агенты

Агенты уже умеют заполнять формы, подписываться, оставлять комментарии:

- [OpenAI Operator](https://openai.com/index/introducing-operator/) (87% success rate)
- Google Project Mariner
- Perplexity Comet
- [Skyvern](https://github.com/skyvern-ai/skyvern) (open source)
- [Browser Use](https://browser-use.com) (89.1% WebVoyager, 21k+ звёзд)
- [Manus](https://manus.im) — агент через браузеры, терминалы, редакторы

### Память и индексирование

- [Supermemory](https://supermemory.ai) — Universal Memory API для AI: граф знаний из веб-страниц, recall <300ms
- [Diffbot](https://diffbot.com) — 10 млрд сущностей, обновляется каждые 4-5 дней, собственная LLM с GraphRAG

---

## GEO (Generative Engine Optimization)

### Академическая основа

**GEO: Generative Engine Optimization** (Princeton, KDD 2024) — первая формализация GEO как дисциплины. Методы (статистика, цитаты, упрощение языка) повышают видимость до **+40%**. Бенчмарк GEO-BENCH: 10K запросов ([arxiv](https://arxiv.org/abs/2311.09735)).

### Что делает контент цитируемым (данные исследований)

**Ссылочный профиль и авторитет домена** — сильнейший предиктор:

- Сайты с 32K+ referring domains: 2× больше цитат (с 2.9 до 5.6) ([SE Ranking / SEJ](https://www.searchenginejournal.com/new-data-top-factors-influencing-chatgpt-citations/561954/))
- Domain Trust 97-100: 8.4 цитаты. Ниже 43: 1.6 цитаты

**Узнаваемость бренда** — предиктор с корреляцией **0.334**, выше ссылочного профиля ([Digital Bloom](https://thedigitalbloom.com/learn/2025-ai-citation-llm-visibility-report/))

**Формат контента:**

- Сравнительные статьи/listicles: **32.5%** всех AI-цитат (первое место)
- Оптимальная длина: от 2900 слов (5.1 цитаты vs 3.2 для <800)
- Оптимальный раздел между заголовками: 120-180 слов
- Мультимодальный контент (текст + изображения + видео): **+156%** выбора AI-системами

**Обогащение контента:**

- Статистика и числа: **+22%** видимости
- Цитаты из авторитетных источников: **+37%**
- Ссылки на источники: **+115%** для сайтов с позицией 5+

**Свежесть:**

- Обновлённый в течение 3 месяцев: **1.7×** больше цитат. 65% обращений AI-ботов — к контенту моложе 1 года ([Seer Interactive](https://www.seerinteractive.com/insights/study-ai-brand-visibility-and-content-recency))
- LLM систематически предпочитают контент с более свежей датой — доказано на 7 моделях ([Waseda University / SEL](https://searchengineland.com/fool-ai-models-fake-dates-boost-visibility-463227))

**Техническое:**

- FCP < 0.4с: **+87%** цитат vs медленные сайты
- FAQ Schema и llms.txt: почти **не влияют** или отрицательно (SE Ranking study)

### AEO vs GEO

- **AEO** (Answer Engine Optimization): Featured Snippets, People Also Ask, голосовой поиск — короткие извлекаемые ответы
- **GEO** (Generative Engine Optimization): ChatGPT, Perplexity, Gemini — глубина, доверие, earned media

Разные стратегии: для Featured Snippets — короткие конкретные ответы в начале статьи. Для ChatGPT/Perplexity — глубина, ссылки, упоминания в третьих источниках.

### Как AI-поисковики выбирают источники

- **87%** цитат ChatGPT совпадают с топ-10 Bing (партнёрство OpenAI/Microsoft) ([Seer Interactive](https://www.seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results))
- **Только 11%** сайтов появляются одновременно в ChatGPT и Perplexity — платформы черпают из разных источников
- Топ-50 доменов получают **48%** цитат, остальные 52% — длинный хвост нишевых сайтов ([Wellows: 7785 запросов, 485K цитат](https://wellows.com/insights/chatgpt-citations-report/))
- AI-поисковики предпочитают **earned media** над brand-owned контентом — противоположность Google ([arxiv](https://arxiv.org/abs/2509.08919))
- Reddit упоминается в **14-38%** AI-ответов; рост Reddit в AI Overviews: **+450%** за 3 месяца ([AirOps](https://www.airops.com/report/the-impact-of-ugc-and-community-in-ai-search))

### Google AI Overviews: данные

- 54% цитат из AI Overview совпадают с органическим топом (рост с 32.3% за 16 месяцев) ([BrightEdge](https://www.brightedge.com/resources/weekly-ai-search-insights/rank-overlap-after-16-months-of-aio))
- 47% контента берётся с позиций ниже 5-й — не обязательно быть в топ-5 ([Semrush](https://www.semrush.com/blog/semrush-ai-overviews-study/))
- Wikipedia, YouTube, Reddit, Google-сервисы и Amazon: **38%** всех цитат в AI Overviews

---

## Академические исследования

### Бенчмарки веб-агентов

| Работа                   | Конференция  | Ключевой результат                                                            | Ссылка                                    |
| ------------------------ | ------------ | ----------------------------------------------------------------------------- | ----------------------------------------- |
| **WebArena**             | ICLR 2024    | 812 задач: GPT-4 = 14.4%, люди = 78%                                          | [arxiv](https://arxiv.org/abs/2307.13854) |
| **Mind2Web**             | NeurIPS 2023 | 2350 задач, 137 сайтов: фильтрация DOM критична                               | [arxiv](https://arxiv.org/abs/2306.06070) |
| **SeeAct**               | ICML 2024    | 51.1% с ручным граундингом, значительно хуже автономно                        | [arxiv](https://arxiv.org/abs/2401.01614) |
| **WebVoyager**           | ACL 2024     | Первый мультимодальный агент на реальных сайтах: 59.1%                        | [arxiv](https://arxiv.org/abs/2401.13919) |
| **Illusion of Progress** | COLM 2025    | Реальные результаты занижены на 59% vs бенчмарки. JS-рендеринг ломает агентов | [arxiv](https://arxiv.org/abs/2504.01382) |

### Концепции агент-дружественного веба

- **"Build the Web for Agents, Not Agents for the Web"** — концепция Agentic Web Interface (AWI): шесть принципов проектирования для агентов ([arxiv](https://arxiv.org/abs/2506.10953))
- **"Agentic Web: Weaving the Next Web with AI Agents"** — обзор через три оси: интеллект, взаимодействие, экономика (Agent Attention Economy) ([arxiv](https://arxiv.org/abs/2507.21206))
- **"From Semantic Web and MAS to Agentic AI"** — эволюция: интеллект переехал из внешних данных (RDF/OWL) в саму модель (LLM). Четырёхосевая таксономия ([arxiv](https://arxiv.org/abs/2507.10644))

### Accessibility = Agent-Friendliness

Агенты на основе accessibility tree: **~85%** задач. На основе скриншотов: **~50%**. Правильные ARIA-метки и семантический HTML напрямую повышают точность агента ([accessibility.works](https://www.accessibility.works/blog/do-accessible-websites-perform-better-for-ai-agents/)).

### Factuality и Grounding

**FACTS Grounding** (Google DeepMind): 1,719 примеров, документы до 32K токенов. Лучшая модель (Gemini 3 Pro) = **68.8%** — огромный простор для роста. Качество структурированного входного документа критически влияет на результат ([DeepMind](https://deepmind.google/blog/facts-grounding-a-new-benchmark-for-evaluating-the-factuality-of-large-language-models/)).

---

## Институции и стандартизация

### Agentic AI Foundation (AAIF) — Linux Foundation

Учреждён декабрь 2025. Платиновые участники: AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI. Три якорных проекта: MCP, goose (Block), AGENTS.md ([aaif.io](https://aaif.io/)).

### W3C группы

- **AI Agent Protocol CG** (188 участников, с мая 2025) — протоколы discovery, идентификации, взаимодействия агентов ([w3.org](https://www.w3.org/community/agentprotocol/))
- **WebAgents CG** (с 2023) — Hypermedia MAS, Linked Data для агентов ([w3.org](https://www.w3.org/community/webagents/))
- **Web & AI Interest Group** (чартер октябрь 2025) — координация AI-стандартов ([w3.org](https://www.w3.org/2025/10/webai-ig-charter.html))

### IETF

- **AIPREF WG** — словарь + HTTP-привязка AI-предпочтений. Milestone: август 2026 ([datatracker](https://datatracker.ietf.org/wg/aipref/about/))
- **IAB AI-CONTROL Workshop** — отчёт о воркшопе по opt-out для ИИ, основа AIPREF ([datatracker](https://datatracker.ietf.org/doc/draft-iab-ai-control-report/))
- **Agent Considerations in Specs** — предложение добавить раздел «Agent Considerations» в интернет-черновики (аналог Security Considerations) ([IETF](https://www.ietf.org/archive/id/draft-steele-agent-considerations-00.html))
- **Token-efficient Data Layer (ADOL)** — дедупликация схем, адаптивное включение полей для борьбы с token bloat ([datatracker](https://datatracker.ietf.org/doc/draft-chang-agent-token-efficient/))

### Другие агентские протоколы

- **ACP** (IBM → Linux Foundation) — REST/HTTP агент-агент, влился в A2A ([agentcommunicationprotocol.dev](https://agentcommunicationprotocol.dev/))
- **AGNTCY/OASF** (Cisco/LangChain → Linux Foundation) — OCI-based описание агентов + SLIM messaging. 65+ компаний ([agntcy.org](https://agntcy.org/))
- **Oracle Agent Spec** — декларативный язык описания агентных систем ([oracle.github.io](https://oracle.github.io/agent-spec/))
- **ANP (Agent Network Protocol)** — «HTTP для агентского интернета». did:wba + JSON-LD + Schema.org ([GitHub](https://github.com/agent-network-protocol/AgentNetworkProtocol))

---

## Тренды

1. **Конвергенция вокруг MCP** — NLWeb нативно является MCP-сервером, A2A включает llms.txt, OpenAPI 3.2 добавил MCP-коннекторы, WebMCP несёт MCP в браузер
2. **Cloudflare как платформа агентного веба** — Markdown for Agents, AutoRAG, NLWeb, AI Index, Pay Per Crawl, Content-Signal — всё в одном Dashboard
3. **"R.V. Guha effect"** — создатель RSS/RDF/Schema.org теперь строит NLWeb. Агентный веб = семантический веб, который получил "клиента" (LLM)
4. **IETF стандартизирует AI-предпочтения** — AIPREF WG превращает ad-hoc решения (robots.txt для AI, Content-Signal) в официальный стандарт
5. **Accessibility = Agent-Friendliness** — агенты на accessibility tree: 85% vs 50% на скриншотах. Одни вложения — двойной эффект
6. **Формат ≠ серебряная пуля** — HtmlRAG: HTML лучше plain text. MDEval: Markdown = GPT-4o уровень. Prompt Formatting: JSON vs Markdown зависит от модели
7. **Zero-click — новая норма** — 60% запросов без клика, издатели теряют 30-50% трафика. Диверсификация обязательна
8. **Институционализация** — AAIF (Linux Foundation), AIPREF (IETF), W3C CG. Агентный веб выходит из стадии эксперимента
9. **Earned media важнее brand-owned** — AI-поисковики предпочитают упоминания в третьих источниках. Reddit +450% в AI Overviews
10. **RSS возрождается через MCP** — RSS/Atom + MCP-сервер = агенты подписываются на контент

---

## Чеклист внедрения (по приоритету)

### Сделать сейчас (минимальные усилия)

- [ ] Включить Markdown for Agents в Cloudflare Dashboard
- [ ] Создать `/llms.txt` в корне сайта
- [ ] Добавить Schema.org/JSON-LD (BlogPosting) в layout — `datePublished`, `dateModified`, `author`, `description`
- [ ] Проверить RSS фид — полный контент, не excerpt
- [ ] Проверить robots.txt — не блокировать GPTBot, ClaudeBot, PerplexityBot
- [ ] Семантический HTML + ARIA-метки (accessibility = agent-friendliness)
- [ ] Регулярно обновлять контент и ставить явные метки «обновлено [дата]»
- [ ] Alt-тексты на все изображения, подписи к таблицам
- [ ] Тест: [LLM Clicks AI Readiness Checker](https://llmclicks.ai/ai-readiness-analyzer/)

### Средний горизонт

- [ ] NLWeb + Cloudflare AutoRAG (`/ask` + `/mcp`)
- [ ] Content-Signal HTTP заголовки
- [ ] MCP-сервер для сайта (через Cloudflare AI Index или вручную)
- [ ] GEO: сравнительные статьи с данными, статистикой, ссылками на источники
- [ ] Мониторинг AI-видимости: [Otterly.ai](https://otterly.ai) или [Profound](https://tryprofound.com)
- [ ] Bing-оптимизация (87% цитат ChatGPT = топ-10 Bing)

### Экспериментально

- [ ] RAG-чатбот (self-hosted или Kapa.ai)
- [ ] WebMCP (`navigator.modelContext`) — готовиться к стандарту
- [ ] AGENTS.md в репозитории
- [ ] Контент о процессе внедрения agent-friendly подходов

---

## Ключевые источники

### Блоги и отчёты

- [Cloudflare: Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
- [Cloudflare: Conversational Search with NLWeb and AutoRAG](https://blog.cloudflare.com/conversational-search-with-nlweb-and-autorag/)
- [Cloudflare: AI Index](https://blog.cloudflare.com/an-ai-index-for-all-our-customers/)
- [Cloudflare: From Googlebot to GPTBot](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/)
- [Cloudflare: Crawl-to-Click Gap](https://blog.cloudflare.com/crawlers-click-ai-bots-training/)
- [Seer Interactive: 87% ChatGPT Citations = Bing Top](https://www.seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results)
- [Wellows: 7K Queries, 485K Citations](https://wellows.com/insights/chatgpt-citations-report/)
- [SE Ranking / SEJ: Top 20 Factors](https://www.searchenginejournal.com/new-data-top-factors-influencing-chatgpt-citations/561954/)
- [Digital Bloom: AI Visibility Report](https://thedigitalbloom.com/learn/2025-ai-citation-llm-visibility-report/)
- [Digital Bloom: Organic Traffic Crisis](https://thedigitalbloom.com/learn/2025-organic-traffic-crisis-analysis-report/)
- [BrightEdge: AI Overview Citations](https://www.brightedge.com/resources/weekly-ai-search-insights/rank-overlap-after-16-months-of-aio)
- [Semrush: AI Overviews Study](https://www.semrush.com/blog/semrush-ai-overviews-study/)
- [AirOps: UGC and Community in AI Search](https://www.airops.com/report/the-impact-of-ugc-and-community-in-ai-search)
- [AdExchanger: AI Search Dismantling Open Web Traffic](https://www.adexchanger.com/publishers/the-ai-search-reckoning-is-dismantling-open-web-traffic-and-publishers-may-never-recover/)
- [Web Almanac 2024: Structured Data](https://almanac.httparchive.org/en/2024/structured-data)

### Академические работы

- [GEO: Generative Engine Optimization (KDD 2024)](https://arxiv.org/abs/2311.09735)
- [HtmlRAG: HTML > Plain Text for RAG (WWW 2025)](https://arxiv.org/abs/2411.02959)
- [MDEval: Markdown Awareness Benchmark (ACM 2025)](https://arxiv.org/abs/2501.15000)
- [Does Prompt Formatting Have Any Impact?](https://arxiv.org/abs/2411.10541)
- [Beyond Pixels: DOM Downsampling (D2Snap)](https://arxiv.org/abs/2508.04412)
- [Build the Web for Agents (AWI)](https://arxiv.org/abs/2506.10953)
- [VOIX: Declarative Agent-Web Interaction](https://arxiv.org/abs/2511.11287)
- [Agentic Web: Weaving the Next Web](https://arxiv.org/abs/2507.21206)
- [From Semantic Web to Web of Agents](https://arxiv.org/abs/2507.10644)
- [WebArena (ICLR 2024)](https://arxiv.org/abs/2307.13854)
- [Mind2Web (NeurIPS 2023)](https://arxiv.org/abs/2306.06070)
- [SeeAct (ICML 2024)](https://arxiv.org/abs/2401.01614)
- [WebVoyager (ACL 2024)](https://arxiv.org/abs/2401.13919)
- [Illusion of Progress (COLM 2025)](https://arxiv.org/abs/2504.01382)
- [News Citing in AI Search (2025)](https://arxiv.org/html/2507.05301v1)
- [ai.txt DSL](https://arxiv.org/html/2505.07834v1)
- [FACTS Grounding (Google DeepMind)](https://arxiv.org/abs/2501.03200)
- [Accessibility & AI Agents](https://www.accessibility.works/blog/do-accessible-websites-perform-better-for-ai-agents/)

### Стандарты и спецификации

- [IETF AIPREF WG](https://datatracker.ietf.org/wg/aipref/about/)
- [IETF Agentic JWT](https://datatracker.ietf.org/doc/draft-goswami-agentic-jwt/)
- [IETF Agent Discovery](https://datatracker.ietf.org/doc/draft-cui-ai-agent-discovery-invocation/)
- [IETF Agent Considerations](https://www.ietf.org/archive/id/draft-steele-agent-considerations-00.html)
- [IETF Token-efficient Data Layer](https://datatracker.ietf.org/doc/draft-chang-agent-token-efficient/)
- [W3C AI Agent Protocol CG](https://www.w3.org/community/agentprotocol/)
- [W3C WebAgents CG](https://www.w3.org/community/webagents/)
- [WebMCP](https://webmcp.link/)
- [AGENTS.md](https://agents.md/)
- [AAIF (Linux Foundation)](https://aaif.io/)
- [C2PA 2.2](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html)
- [IEEE 7012-2025](https://ieeexplore.ieee.org/document/11360682)
- [HN Discussion](https://news.ycombinator.com/item?id=46997526)
