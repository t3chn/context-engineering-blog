---
title: "Agent-friendly веб: context engineering в масштабе интернета"
description: "Как формат подачи контента определяет, увидит ли его AI-агент. Данные исследований, реальные стандарты и что делать прямо сейчас."
date: 2026-02-18
tags: ["context-engineering", "agents", "web", "standards"]
lang: ru
---

## Проблема

AI-агенты стали новыми читателями веба. GPTBot вырос на 305% за год. AI-краулеры генерируют трафик, сопоставимый с Google. Но большинство сайтов построены так, как будто их единственные клиенты — люди с браузерами.

Результат: на бенчмарке WebArena лучший GPT-4-агент решает 14.4% задач на реальных сайтах. Люди — 78%. Агенты захлёбываются в HTML, теряются в JavaScript-рендеринге и не могут извлечь структуру из визуального шума.

Это не проблема моделей. Это проблема контента.

## Контекст

Один и тот же блог-пост — 16,180 токенов в HTML и 3,150 в Markdown. Разница в 5 раз. Для агента, который платит за каждый токен и имеет ограниченное контекстное окно, это разница между «вижу» и «не влезает».

Но дело не только в размере. Исследование HtmlRAG (WWW 2025) показало неожиданное: HTML с семантическими тегами (`<h2>`, `<table>`, `<code>`) превосходит plain text в RAG-системах. Конверсия в чистый текст уничтожает структурную информацию, которая помогает модели ориентироваться. Не «больше текста», а «правильная структура».

Ещё один сюрприз: формат подачи меняет точность модели до 40%. GPT-3.5 предпочитает JSON, GPT-4 — Markdown. Универсального «лучшего» формата нет — есть формат, подходящий конкретной модели и задаче.

Это буквально context engineering. Те же принципы, которые мы применяем к промптам — структура важнее объёма, формат влияет на результат, семантика побеждает сырые данные — теперь нужно применять к веб-контенту.

И мир это осознал. За 2025 год стандартизация агентного веба взорвалась: IETF создал рабочую группу AIPREF для стандартизации AI-предпочтений в HTTP-заголовках. W3C запустил три Community Group по агентным протоколам. Linux Foundation учредил Agentic AI Foundation с участием AWS, Anthropic, Google, Microsoft и OpenAI.

## Решение

### Accessibility = Agent-friendliness

Самая неожиданная находка. Агенты, работающие через accessibility tree (семантический HTML, ARIA-метки), успешно выполняют ~85% задач. Агенты на основе скриншотов — ~50%.

Одни и те же вложения дают двойной эффект: сайт становится доступнее для людей с ограниченными возможностями и одновременно читабельнее для AI-агентов. Семантические теги `<nav>`, `<main>`, `<article>`, `<aside>` — не формальность, а навигация для машин.

### Что реально влияет на цитируемость в AI-ответах

SE Ranking проанализировал 129,000 доменов. Результаты:

**Работает:**

- Ссылочный профиль — сильнейший предиктор. 32K+ referring domains = 2× цитат
- Свежесть — обновление в последние 3 месяца даёт 1.7× больше цитат
- Скорость — FCP < 0.4с: +87% цитат
- Длина — статьи от 2900 слов: 5.1 цитаты vs 3.2 для коротких
- Статистика в тексте: +22%. Ссылки на источники: +37%

**Не работает:**

- FAQ Schema — почти нулевой или отрицательный эффект
- llms.txt — ни один крупный AI-провайдер не подтвердил чтение (на август 2025)
- Keyword-оптимизированные URL — нерелевантно

87% цитат ChatGPT совпадают с топ-10 Bing. Перплексити и ChatGPT пересекаются только в 11% — платформы черпают из разных источников. Единой стратегии нет.

### Стек agent-friendly сайта в 2026

**Минимум (сделать сегодня):**

- Schema.org/JSON-LD (`BlogPosting`) — подтверждённый эффект: +73% выбора в AI Overviews
- Семантический HTML + ARIA — accessibility = agent-friendliness
- Cloudflare Markdown for Agents — один переключатель в Dashboard
- robots.txt — явно разрешить GPTBot, ClaudeBot, PerplexityBot
- Явные даты `datePublished` / `dateModified` — LLM системно предпочитают «свежий» контент

**Средний горизонт:**

- NLWeb + Cloudflare AutoRAG — `/ask` и `/mcp` endpoint без кода
- Content negotiation (`Accept: text/markdown`) — агенты уже запрашивают
- MCP-сервер для сайта — через Cloudflare AI Index или вручную

**Следить:**

- WebMCP (`navigator.modelContext`) — Google/Microsoft пушат в W3C. Позволяет сайтам публиковать «инструменты» для агентов через браузерный API. Early Preview в Chrome 146
- IETF AIPREF — официальный стандарт AI-предпочтений в HTTP-заголовках. Дедлайн: август 2026
- AGENTS.md — открытый формат инструкций для AI-агентов в репозиториях. 60K+ проектов, донирован в Linux Foundation

### Инструменты для подготовки контента

Агентам нужен чистый контент. Целая индустрия выросла вокруг конверсии:

- **Firecrawl** — любой URL в Markdown/JSON, MCP-сервер, интеграция с Claude
- **Jina Reader** — `r.jina.ai/{URL}` → Markdown, нулевая конфигурация
- **Crawl4AI** — open-source Python-краулер для RAG-пайплайнов

Для мониторинга AI-видимости: Otterly.ai (6 платформ), Profound ($20M seed), бесплатный LLM Clicks AI Readiness Checker.

## Инсайт

Agent-friendly веб — это не отдельная дисциплина. Это context engineering, вывернутый наружу.

Когда мы пишем промпт, мы структурируем контекст для одной модели. Когда мы делаем сайт agent-friendly, мы структурируем контент для тысяч моделей и агентов одновременно. Принципы те же: структура важнее объёма, семантика важнее визуала, формат определяет качество ответа.

Историческая ирония: семантический веб (RDF, OWL, Schema.org) пытался это сделать 20 лет назад. Не было клиента, который бы это ценил. Теперь клиент появился — LLM. И создатель Schema.org R.V. Guha строит NLWeb, замыкая круг.

Веб перестраивается. Не через революцию — через content negotiation, HTTP-заголовки и /.well-known файлы. Тихо, на уровне протоколов. Те, кто структурирует контент сейчас, получат трафик. Остальные станут невидимыми для нового класса читателей.

## Источники

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
