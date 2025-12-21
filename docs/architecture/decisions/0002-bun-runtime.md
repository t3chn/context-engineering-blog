# ADR-0002: Bun as Primary Runtime

> Status: Accepted
> Date: 2025-12-21

## Context

The Context Engineering Blog project needs to choose a JavaScript/TypeScript runtime for:

1. CLI tool (`apps/cli/`)
2. Video pipeline (`packages/video-pipeline/`)
3. Development tooling

Node.js is the traditional choice, but Bun offers significant improvements in performance and developer experience.

## Decision

We will use **Bun** as the primary runtime for all TypeScript/JavaScript code:

- CLI execution via `bun run`
- Package management alongside pnpm (Bun for scripts, pnpm for workspaces)
- Native TypeScript support (no tsx/ts-node)
- Remotion via `bunx remotionb`

### Technical Details

- **Minimum version**: Bun 1.1.45+ (required for ElevenLabs SDK)
- **Remotion command**: Use `remotionb` instead of `remotion`
- **Workspaces**: Continue using pnpm workspaces (Bun-compatible)

## Consequences

### Positive

- **Native TypeScript**: No compilation step, no tsx/ts-node configuration
- **Faster startup**: ~10x faster CLI startup time
- **Faster installs**: ~25x faster package installation
- **Modern tooling**: Built-in test runner, bundler
- **Simpler toolchain**: Fewer dependencies to manage

### Negative

- **Windows experimental**: Contributors on Windows may have issues
- **Smaller ecosystem**: Some Node.js packages may not work
- **Learning curve**: Team needs to learn Bun-specific commands

### Neutral

- FFmpeg rendering (Remotion) is unchanged — runtime doesn't affect video encoding
- ElevenLabs API calls are network-bound — runtime doesn't affect latency
- Migration path exists: can switch back to Node.js if needed

## Compatibility Verified

| Dependency | Bun Support | Notes |
|------------|-------------|-------|
| Remotion | Official | Use `remotionb` command |
| ElevenLabs SDK | Official | Requires Bun 1.1.45+ |
| Commander.js | Works | CLI framework |
| Inquirer | Works | Interactive prompts |
| grammy | Works | Telegram bot |

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Node.js + tsx | Mature, stable | Slower, extra config | Bun is simpler |
| Node.js + ts-node | Battle-tested | Slowest option | Poor DX |
| Deno | Modern, secure | Different module system | Less ecosystem support |

## Related

- ADR: [0001-video-kinetic-typography.md](0001-video-kinetic-typography.md)
- Feature: [../../features/video-shorts.md](../../features/video-shorts.md)
