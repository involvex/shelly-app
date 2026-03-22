# Copilot instructions

## Build, lint, and test commands

- `bun install` — installs dependencies for the entire monorepo (root workspace-aware `bun.lock`).
- `bun run format` — runs Prettier across every workspace.
- `bun run lint` / `bun run lint:fix` — run the shared ESLint Flat Config and auto-fix issues; `lint` is what CI checks, `lint:fix` is the quicker repair shortcut.
- `bun run typecheck` — TypeScript verification (`tsc --noEmit`) and the closest thing to a “test” suite in this repo.
- `bun run prebuild` — runs `format`, `lint:fix`, and `typecheck` back to back before any build.
- `bun run build` — orchestrates `bun run build:shared` (packages/shared) followed by `bun run build:app`, which ultimately shells out to `bun run -F @shelly/mobile expo:prebuild`.
- `bun run start:app` — launches the Expo development server from `@shelly/mobile` via `bun run -F @shelly/mobile start`. Use this to spin up Metro and target Android/iOS/web simulators.
- For platform-specific runners you can still call the underlying Expo commands from the mobile workspace (e.g., `bun run -F @shelly/mobile android`, `ios`, or `web`), but the wrapper scripts above keep the Bun workspace context intact.

## High-level architecture

- **Monorepo layout:** `bun` workspaces span everything under `apps/*` and `packages/*`. The mobile client lives in `apps/mobile` (an Expo Router + React Native UI), while `packages/shared` is a standalone package that holds cross-cutting utilities/components that both runtimes can import via `@shelly/shared`.
- **Expo/React Native app:** `apps/mobile` uses Expo Router for file-based navigation, Nativewind for Tailwind-style styling, and custom dropdown/menu components built with Zeego/Nativwind/shadcn/ui depending on platform. Metro is configured via `metro.config.js`, and `app/` hosts the root layout/pending boundaries used by the router. Expect a web entry point alongside native entry files.
- **Shared build contract:** The repo builds the shared package first, then calls `expo prebuild` inside the mobile workspace so that native projects stay in sync. TypeScript paths (`@/`, `@shelly/mobile/*`) make it easy to import assets/components from `apps/mobile/src` and reuse the shared package without relative paths.
- **Runtime tooling:** Bun is the default runtime and package manager; scripts use `bun run` everywhere to ensure the workspace resolution logic stays consistent across packages and Expo workflows.

## Key conventions

- **Prebuild hygiene:** The `prebuild` script (format → lint:fix → typecheck) is the gatekeeper for every build and deploy task. Use it whenever you need to validate both formatting and static typing before invoking `build`.
- **Path aliases:** `tsconfig.json` defines `@/` → `apps/mobile/src/*`, `@shelly/shared` → `packages/shared/src/index.ts`, and `@shelly/mobile/*` → `apps/mobile/src/*`. Prefer these aliases over manual relative traversals so imports resolve correctly in both Bun and Expo bundlers.
- **Expo Router conventions:** `apps/mobile/src/app` follows the file-based routing system. Keep route-level UI under `app/`, shared components in `components/`, and data logic in `stores/`/`services/`. Terminal components lean on `TerminalView` + `TerminalToolbar`, while overlays (like `SnippetOverlay`) hook into the global modal stack.
- **Styling stack:** Nativewind provides the Tailwind DSL for mobile components, while `TerminalView.web.tsx` and other web-specific files still rely on Tailwind-compatible `className` strings. Keep styles declarative and consistent with the rest of the repo (e.g., use Tailwind tokens that exist in `global.css` or the shared theme).
- **Shared utilities:** Anything that needs to power both web and native runtimes belongs in `packages/shared`. This package is built first and published internally, so treat it as the canonical source for reusable hooks, helpers, and constants consumed by the Expo app.
- **Lint configuration:** ESLint runs as a Flat Config (see `eslint.config.ts`) with TypeScript/React/CSS plugins. Keep configuration close to the root and avoid custom per-package configs unless a new workspace requires exceptional rules.
