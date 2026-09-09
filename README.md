# @teootoledo/context-router-backend

A Backstage backend plugin, self-hosted by an adopting company inside their own Backstage instance. It receives file content (never paths) over HTTPS/REST from a company's [context-router-daemon](https://github.com/teootoledo/context-router-daemon) instances, wraps it in XML under a strict Bulk-Reader system prompt, calls a worker LLM (currently Gemini Flash), and returns a condensed summary. It holds the worker-model API key so individual developer machines never need one.

## Install & run

```bash
npm install
npm test        # tsx --test test/*.test.ts
```

Depends on [`@teootoledo/context-router-contract`](https://github.com/teootoledo/context-router-contract) for the shared request/response schema.

Node 22+. TypeScript runs through [`tsx`](https://github.com/privatenumber/tsx), never `node --experimental-strip-types` — no Jest, no Vitest, no build step.

**Known limitation:** this package has no `main` field and its plugin export (`contextRouterPlugin` in `src/plugin.ts`) is a named export, not a default export — so it isn't yet consumable via `backend.add(import('@teootoledo/context-router-backend'))`. That's a change to the plugin's public API surface, tracked separately from making the package installable at all.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
