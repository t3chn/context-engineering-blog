# Telegram Platform Guide

**Channel**: @ctxtdev

## Channel Role

Telegram is the **field-notes layer** for ctxt.dev.

That means:

- earlier than the blog
- shorter than the blog
- sharper than the blog

It is **not** a blog mirror and **not** an article-summary feed.
If a reader already follows the blog, Telegram still has to provide extra value.

## Reader Promise

People should get one of these from the channel:

- a sharp observation before it becomes an article
- a concrete build note from current work
- a design cut or reversal
- a compact dispatch to a new article when a link is actually useful

## Format

- 3-6 short paragraphs by default, 1-3 lines each
- Plain text, minimal formatting
- Emoji only for emphasis (1-2 max per post)
- Hashtags at the end
- Length: default 350-650 characters, extended up to 900 only when needed
- One idea per post
- One link max, only when it adds value

## Tone

- Confident, but not preachy
- Technical, but accessible
- Practical: specifics > abstractions
- Honest: voice doubts openly

## Post Jobs

Choose **exactly one** job for each post:

1. **Signal** — one hard observation, usually no link
2. **Cut** — one architectural decision or reversal, link optional
3. **Build Note** — one concrete change or lesson from active work, link optional
4. **Dispatch** — one payoff from a new article plus one link

Default to **Signal**, **Cut**, or **Build Note**.
Use **Dispatch** only when notes clearly point to an actual article launch.

## Post Structure

```text
[Hard observation or tension]

[Why it matters]

[What changed / what you now believe]

[Consequence or insight]

#contextengineering [optional second tag]
```

## Writing Mechanics

- Start with the strongest sentence, not throat-clearing
- Lead with a problem, observation, or contradiction
- Keep paragraph rhythm tight
- Prefer specifics over abstractions
- Prefer one payoff over three partial takeaways
- Write in the same language as the source notes unless asked otherwise

## Prohibited

- Excessive emoji
- Bullet lists (visual noise in TG)
- Author signature
- CTA ("subscribe!")
- Bold/italic formatting
- Long paragraphs (>3 lines)
- Generic intros like "Сегодня изучил..." / "New post..." / "Thoughts on..."
- Turning every post into a compressed article summary

## Examples

### Canonical Field-Notes Post

```text
Агентные рантаймы часто путают coordination с reliability.

Они добавляют роли, оркестрацию и новые surfaces.
Демо становится сложнее.
Trust не становится выше.

Полезный вопрос другой: где у системы граница между planning, execution и verification.

Если эти вещи живут в одном loop, shell начинает играть роль second source of truth.

Похоже, что следующий шаг в agent tooling - не больше personalities, а больше boundaries.

#contextengineering #agents
```

### Bad Post

```text
🚀🔥 IMPORTANT INSIGHT! 🔥🚀

Today I realized something INCREDIBLE about context engineering!

• Point 1
• Point 2
• Point 3

Subscribe to not miss out!

— Author
```

## Hashtags

Required:

- `#contextengineering`

Optional (by topic):

- `#llm`
- `#ai`
- `#agents`
- `#anthropic`
- `#claude`
- `#prompts`
- `#debugging`
- `#hypothesis`
