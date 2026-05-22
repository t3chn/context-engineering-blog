# Project Intent

<!-- Edit this file to describe your project. punk init will not overwrite it once edited. -->

## What does this project do?

Context Engineering Blog publishes technical articles, field notes, and
cross-channel publication receipts about context engineering, AI-agent workflows,
and practical LLM systems.

## Tech stack

- Language: typescript
- Frameworks: none detected
- Test runner: unknown
- Build system: npm

## Scope boundaries

### Never touch

- `pnpm-lock.yaml`
- `.envrc`
- `.env.example`
- `apps/cli/dist`
- `apps/blog/dist`

## Notes

Publishing/channel operating state lives in the external workspace referenced by
`.punk/publishing.local.toml`.
