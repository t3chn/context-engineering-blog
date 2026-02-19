# Context-First Thinking — Style Guide

## Philosophy

Context engineering is not prompt engineering with a larger context window.
It's an engineering discipline: how to structure information for LLMs.

**Our approach**: share practical insights, not abstract theories.

## Content Structure

### 4 Elements of Every Post

1. **Problem** — specific pain point or observation
   - What's not working?
   - What pattern did you notice?

2. **Context** — why it matters
   - Why is it hard?
   - What are the constraints?

3. **Solution** — practical approach
   - How to solve it?
   - What pattern to use?

4. **Insight** — what changed in understanding
   - What new thing did you learn?
   - How does it change the approach?

## Language

- **Primary**: Russian
- **Technical terms**: in English (context engineering, prompt, LLM)
- **Hashtags**: #contextengineering #llm #ai (always in English)

## Good Post Examples

### Example 1: Observation

```
Prompt engineering is marketing.
Context engineering is product.

The difference: a prompt tries to "convince" the model.
Context gives the model everything it needs to work.

The first approach is fragile.
The second — scales.

#contextengineering #llm
```

### Example 2: Practical Insight

```
Spent a day debugging a prompt.
The problem wasn't in the prompt.

The model didn't know project context:
what files exist, what dependencies.

Added repository structure to context.
Prompt became 3x shorter.
Result — more stable.

#contextengineering #debugging
```

### Example 3: Doubt

```
Not sure large context windows are a panacea.

100K tokens sounds like a lot.
But if context is unstructured —
the model gets lost just like a human in a long document.

Hypothesis: structure matters more than volume.
Will be testing.

#contextengineering #hypothesis
```
