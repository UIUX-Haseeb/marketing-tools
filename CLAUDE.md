# Prov Toys — notes for AI assistants

Front-end-only Next.js 16 / TypeScript app for Provident Estate. Demo data, no auth, no DB, no env vars. Read README.md first.

- Tools live in `src/tools/<slug>/` (self-contained, each with a README; see `src/tools/README.md`) and are registered in `src/lib/tools.ts`. Never hardcode tool lists elsewhere. Tool-specific code and assets stay inside the tool's folder; only truly shared code goes in `_shared/`.
- Data: employees from `src/lib/demo/employees.ts`; requests + post log in `src/lib/store.ts` (localStorage). Keep the types in `src/lib/demo/types.ts` stable — they are the integration contract.
- UI: Tailwind v4 + primitives in `src/components/ui`. Brand tokens in `src/app/globals.css`; rules in STYLEGUIDE.md. Google Sans Flex only; weights 300 body / 400 headers / 500 tracked caps. Orange is an accent only. Keep screens simple.
- Post engine in `src/tools/_shared/` is a faithful port — do not change template geometry or the font lock.
- Next 16: route params/searchParams are Promises.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
