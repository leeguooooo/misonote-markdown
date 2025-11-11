# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts Next.js route handlers and UI entrypoints; `src/components` holds shared React pieces; `src/core` and `src/business` wrap collaborative and enterprise logic.
- Shared helpers live in `src/lib` (client/server glue) and the top-level `lib/` directory (database, websocket, migration tooling).
- Static assets live in `public/`, docs and specs in `docs/`, and automation scripts in `scripts/`.
- Enterprise assets sit in `enterprise/`, `misonote-license-server/`, and `data/`; automated and regression suites run from `tests/` and files like `test-final-integration.js`.

## Build, Test & Development Commands
- `pnpm install` keeps workspace dependencies in sync; rerun whenever `pnpm-lock.yaml` changes.
- `pnpm dev` launches Next.js with Turbopack on port 3001; `pnpm dev:all` pairs it with `pnpm ws:dev` to run the Y-WebSocket server.
- `pnpm build` runs pre-build checks and optimizes the app; `pnpm start` serves the compiled output.
- Quality gates: `pnpm lint`, `pnpm test`, `pnpm test:coverage`; run `pnpm clean` before Docker or PM2 validation.

## Coding Style & Naming Conventions
- TypeScript first with strict typing; default to React Server Components unless interactivity demands `use client`.
- Follow 2-space indentation, trailing commas, and single quotes (enforced by `pnpm lint` with eslint-config-next).
- File naming: PascalCase for components (`src/components/EditorPane.tsx`), camelCase for hooks/utilities, kebab-case for directories.
- Tailwind CSS 4 powers styling; co-locate component styles and order utility classes layout > spacing > color for readability.

## Testing Guidelines
- Vitest drives unit and integration suites; create files as `*.test.ts` or `*.test.tsx` under `tests/` or beside the source.
- Use React Testing Library for UI contracts and mock the collaborative websocket via `lib/websocket/simple-server`.
- Run `pnpm test:run` in CI-like mode and `pnpm test:coverage` before merging; hold critical paths at ≥90% branch coverage.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in history; keep subjects ≤72 characters and prefer English summaries even if the body is bilingual.
- One logical change per commit; reference issues with `Refs #123`.
- Pull requests must describe problem/solution, list test evidence, and flag infra or license-server updates.

## Security & Configuration Tips
- Store secrets in `.env.local`; never commit credentials. Generate passwords with `pnpm security:setup`.
- License flows rely on `misonote-license-server/scripts/license-generator.js`; rotate keys before enterprise releases.
- When touching database scripts, run `pnpm db:status` and document migration steps in the PR body.
