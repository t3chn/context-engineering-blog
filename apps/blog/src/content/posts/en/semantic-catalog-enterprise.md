---
title: "Semantic Catalog: How Enterprise Teams Engineer Context"
description: "Why Text-to-SQL and direct REST API mapping fail, and how a semantic graph of business entities solves the context delivery problem in enterprise."
date: 2025-12-25
tags: ["context-engineering", "mcp", "enterprise", "semantic-catalog"]
lang: en
---

## Problem

Text-to-SQL seemed like an elegant solution. The agent understands the question, generates SQL, retrieves data. In practice — security issues, syntax errors, production outages.

Direct REST API mapping to MCP tools isn't any better. Agents get confused by redundant parameters and complex call chains. The more endpoints, the worse the results.

Both strategies share one thing: they give the agent access to raw data and hope it figures things out.

## Context

When teams work with large enterprises, simple methods stop working. Not because models aren't smart enough — GPT-4 and Claude handle logic just fine. The problem is how we deliver context.

The agent sees database tables. It doesn't understand that `customer_id` relates to `order_id`, which relates to `product_sku`. It doesn't know the business logic: which transactions are considered suspicious, how returns and fraud are connected.

We give it ingredients and ask it to cook a dish. But it doesn't know the recipe and doesn't understand how these ingredients combine.

## Solution

Teams that succeed in enterprise use a different approach — the **semantic catalog**.

### Business Entity Graph

Instead of tables — business objects. Instead of foreign keys — meaningful relationships.

```python
# Semantic catalog example
catalog = SemanticCatalog()

catalog.add_entity("Customer", {
    "attributes": ["name", "email", "risk_score"],
    "relations": {
        "orders": "Order",
        "support_tickets": "Ticket"
    }
})

catalog.add_entity("Order", {
    "attributes": ["amount", "status", "timestamp"],
    "relations": {
        "customer": "Customer",
        "items": "Product"
    }
})
```

The agent now understands business structure, not database schema.

### MCP Protocol and Exploration

The semantic catalog becomes an MCP endpoint through projects like Enrich MCP. The model can "communicate" with data in a common language.

The key difference: the agent doesn't receive a ready answer. It can **explore the data hierarchy**:

1. Get list of orders for a period
2. Find anomalies by amount
3. Navigate to user data
4. Check related attributes (history, returns, risk score)
5. Draw conclusions

The agent navigates the data itself until it finds the solution.

### Unified Context Surface

Instead of separating memory, vector search, and structured data — a **unified interface**. The agent chooses the best navigation method depending on the task:

- Vector search for unstructured data
- Key lookup for exact queries
- Graph traversal for exploring relationships

Metaphor: don't give the chef pre-cut ingredients one by one. Let them into a professionally organized kitchen. Everything is labeled, categorized, logically connected. The chef decides which knife to grab and which refrigerator to check.

## Insight

The problem with enterprise AI isn't model intelligence. Modern models are smart enough.

The problem is **context delivery**. We give the agent access to data but not understanding of structure. We show tables but not relationships.

A semantic catalog is context engineering in practice. Not RAG, not prompt engineering, but a complete system that lets the agent extract needed data fragments in real time.

Result: moving beyond simple document search to systems capable of solving analytical business problems.

## Sources

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Enrich MCP](https://github.com/anthropics/anthropic-cookbook/tree/main/misc/enrich_mcp)
