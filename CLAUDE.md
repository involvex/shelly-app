# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Summary

- Monorepo: Expo / React Native mobile app at apps/mobile with shared packages under packages/\*.
- Tooling: Bun used to run scripts; Expo (EAS) used for mobile builds; TypeScript and Jest for tests; ESLint for linting.

Common commands

- Install dependencies (preferred):
  - bun install
  - (fallback) npm install or pnpm install

- Run the mobile app (development):
  - cd apps/mobile && expo start
  - or from repo root using Bun scripts if present: bun run -F @shelly/mobile start

- Build (local / prebuild):
  - ./scripts/build.sh
  - or: bun run -F @shelly/mobile expo:prebuild

- Deploy (EAS / publish):
  - ./scripts/deploy.sh
  - or: bunx eas-cli deploy

- Lint:
  - npx eslint .
  - or: bunx eslint .

- Run full test suite:
  - npx jest
  - or (if workspace script exists): bun run -F @shelly/mobile test

- Run a single test file (explicit Jest invocation, recommended):
  - npx jest path/to/file.test.ts

- Run a single test with watch (mobile workspace):
  - cd apps/mobile && npx jest --watch

- Useful CI / diagnostics commands:
  - View GitHub Actions workflow: .github/workflows/android-release-build.yml
  - Run build script locally to reproduce CI: ./scripts/build.sh

High-level architecture

- apps/mobile
  - Expo-managed React Native application (TypeScript).
  - Entry point: apps/mobile/src/app.tsx — main app bootstrap and routing.
  - Key domain logic: apps/mobile/src/services/ssh.ts (SSH connection and terminal integration).
- packages/shared
  - Shared utilities, types, and components reused across workspaces.
- scripts
  - Build, deploy, and helper scripts used by CI (scripts/build.sh, scripts/deploy.sh).
- CI
  - GitHub Actions (see .github/workflows/android-release-build.yml) handle release builds and artifact publishing.

Where to look first when changing behavior

- package.json (root) — workspace scripts and dependency versions
- apps/mobile/package.json — mobile-specific scripts, test, start, and lint entries
- apps/mobile/src/app.tsx: app entrypoint and routing
- apps/mobile/src/services/ssh.ts: SSH logic and terminal handling
- packages/shared/\*: shared helpers and types that should be reused where possible
- scripts/\*: build and deployment steps—update these when CI requirements change
- .github/workflows/android-release-build.yml: CI logic for Android release builds
- eslint.config.ts / .hintrc: lint rules and formatting guidance

Testing and verification

- After changes:
  1. Install dependencies: bun install
  2. Lint: npx eslint . (fix linting issues before committing)
  3. Run tests: npx jest (or a single test: npx jest path/to/file.test.ts)
  4. Start the mobile dev server: cd apps/mobile && expo start — verify app boots and key flows work
  5. Run build script locally to smoke-test CI: ./scripts/build.sh

Notes and conventions

- Prefer reusing packages in packages/shared rather than creating duplicate helpers.
- Use Bun commands when available (bun, bunx, bun run -F ...) since repo uses Bun in scripts. Provide npm/pnpm fallbacks only when Bun is not available on the developer machine.
- When running tests use explicit jest invocations for examples in CLAUDE.md so they work regardless of workspace-specific script names.

Critical files to reference in PRs / reviews

- package.json (root)
- apps/mobile/package.json
- apps/mobile/src/app.tsx:app.tsx:1-200
- apps/mobile/src/services/ssh.ts:services/ssh.ts:1-200
- packages/shared/package.json
- scripts/build.sh
- scripts/deploy.sh
- .github/workflows/android-release-build.yml
- eslint.config.ts
- README.md

Verification checklist for merging

- All unit tests pass locally (npx jest)
- Lint passes (npx eslint .) or fixes included in PR
- Mobile app boots in Expo dev server and critical flows verified manually
- If changing build/deploy scripts, run ./scripts/build.sh locally and ensure artifacts generate

End.
