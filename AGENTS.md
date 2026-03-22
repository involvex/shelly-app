# AGENTS.md - Agent Guidelines for ssh-powershell-shell

This file provides guidelines for AI agents working in this repository.

## Project Overview

- **Project Name**: Shelly App (SSH/PowerShell terminal for mobile)
- **Type**: Monorepo with Expo/React Native mobile app + shared package
- **Runtime**: Bun (package manager and script runner)
- **Repository**: https://github.com/involvex/shelly-app

## Build, Lint, and Test Commands

### Root Workspace Commands

```bash
# Install dependencies
bun install

# Format code (Prettier)
bun run format

# Lint code (ESLint)
bun run lint
bun run lint:fix        # Auto-fix issues

# Type check (TypeScript - closest to "test" suite)
bun run typecheck

# Pre-build validation (format → lint:fix → typecheck)
bun run prebuild

# Build entire monorepo
bun run build

# Build shared package only
bun run build:shared

# Build mobile app (runs expo:prebuild)
bun run build:app

# Start Expo development server
bun run start:app

# Platform-specific runners
bun run -F @shelly/mobile android
bun run -F @shelly/mobile ios
bun run -F @shelly/mobile web
```

### Mobile Workspace Commands (apps/mobile)

```bash
cd apps/mobile

# Prebuild + Expo prebuild
bun run expo:prebuild

# Check dependencies
bun run check          # prebuild + expo:check + doctor
bun run expo:check      # bunx expo install --check
bun run doctor         # bunx expo-doctor --verbose

# Platform runners
bun run android
bun run ios
bun run web
bun run start
```

### Running a Single Test

**Note**: This repository does not have a test suite. The closest thing to testing is:

```bash
# Run type checking
bun run typecheck

# Run linting
bun run lint
```

## Code Style Guidelines

### General Principles

- Follow the existing code patterns in the repository
- Keep code declarative and consistent with the rest of the repo
- Use Tailwind/Nativewind tokens from `global.css` for styling

### Imports and Path Aliases

Use path aliases instead of relative imports:

```typescript
// Good - using path aliases
import {useSSHStore} from '@/store/useSSHStore'
import type {SSHConfig} from '@shelly/shared'
import {cn} from '@/lib/utils'

// Avoid - relative paths when aliases available
import {useSSHStore} from '../store/useSSHStore'
```

**Available aliases**:

- `@/*` → `apps/mobile/src/*`
- `@shelly/shared` → `packages/shared/src/index.ts`
- `@shelly/mobile/*` → `apps/mobile/src/*`

### Formatting

- Use Prettier via `@involvex/prettier-config`
- Run `bun run format` before committing
- Prettier plugins used:
  - `prettier-plugin-organize-imports`
  - `prettier-plugin-packagejson`
  - `prettier-plugin-sort-imports`

### TypeScript

- **Strict mode is enabled** in `tsconfig.json`
- Use explicit types for function parameters and return types
- Use `unknown` type for catch blocks (see error handling below)
- Enable these strict flags if needed:
  ```json
  {
  	"noUnusedLocals": true,
  	"noUnusedParameters": true,
  	"noPropertyAccessFromIndexSignature": true
  }
  ```

### Naming Conventions

- **Variables/functions**: camelCase (`useSSHStore`, `connectServer`)
- **Components/Types/Interfaces**: PascalCase (`SSHStore`, `ISSHService`)
- **Constants**: PascalCase or UPPER_SNAKE_CASE depending on context
- **Files**: kebab-case for utilities, PascalCase for components

```typescript
// Good
const useSSHStore = create<SSHState>(...)
interface SSHConfig { ... }
function connectServer(config: SSHConfig): Promise<void>

// Avoid
const UseSSHStore = ...
function connect_server(...)
```

### React Patterns

- **React 19** is in use with the new JSX transform
- `react/react-in-jsx-scope` is OFF (not needed with new transform)
- Use functional components with hooks
- Zustand for state management

```typescript
// Good - Zustand store pattern
export const useSSHStore = create<SSHState>(set => ({
  service: new MockSSHService(),
  connect: async (config: SSHConfig) => { ... },
}))

// Good - React 19 component
export function TerminalView() {
  const output = useSSHStore(s => s.output)
  return <View>{output}</View>
}
```

### Error Handling

Always use `unknown` type for catch blocks and provide user-friendly messages:

```typescript
// Good
try {
  await service.connect(config)
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : 'Unknown error'
  set({ error: message })
}

// Bad
catch (e) {
  set({ error: e.message })  // May fail if e is not Error
}
```

### ESLint Configuration

- Uses ESLint Flat Config (`eslint.config.ts`)
- React 19.0 recommended rules enabled
- Unused variables warning with underscore prefix ignored:
  ```json
  {
  	"argsIgnorePattern": "^_",
  	"varsIgnorePattern": "^_"
  }
  ```
- Ignores: node_modules, dist, .expo, .next, .turbo, agent directories

### Styling with Nativewind

- Use Nativewind for all mobile styling (Tailwind CSS for React Native)
- Use Tailwind tokens defined in `global.css`
- Use `cn()` utility for conditional class merging:

```typescript
import { cn } from '@/lib/utils'

<View className={cn(
  'flex-1 bg-background',
  isActive && 'border-primary'
)} />
```

### Directory Structure

```
apps/mobile/
├── src/
│   ├── app/           # Expo Router pages (file-based routing)
│   ├── components/    # Shared UI components
│   ├── lib/           # Utilities (utils.ts, etc.)
│   ├── services/     # Service layer (SSH, Mock, etc.)
│   └── store/        # Zustand stores
├── app/               # Root layout/pending boundaries
└── tailwind.config.js

packages/shared/
├── src/
│   └── index.ts       # Shared types, constants, interfaces
└── package.json
```

### Expo Router Conventions

- `apps/mobile/src/app` follows Expo Router file-based routing
- Route-level UI under `app/`
- Shared components in `components/`
- Data logic in `stores/` and `services/`
- Terminal components use `TerminalView` + `TerminalToolbar`
- Overlays (like `SnippetOverlay`) hook into global modal stack

### Shared Package Usage

Anything that needs to work across web and native runtimes belongs in `packages/shared`:

- Types and interfaces (e.g., `SSHConfig`, `ISSHService`)
- Constants and utilities
- Reusable hooks

The shared package builds first, then `expo prebuild` runs in the mobile workspace.

### Prebuild Hygiene

The `prebuild` script is the gatekeeper for builds:

```bash
bun run prebuild  # format → lint:fix → typecheck
```

Always run this before builds and deploys.

### Key Dependencies

- **Expo 55** with Expo Router
- **React Native 0.83.2** with React 19.2.0
- **Nativewind 4.x** for Tailwind styling
- **Zustand 5.x** for state management
- **xterm** for terminal emulation
- **SSH/SFTP** via `@dylankenneally/react-native-ssh-sftp`

### Git Conventions

- Use conventional commit messages if possible
- Run `bun run prebuild` before committing
- Don't commit secrets or credentials
- Don't push force to main/master

### Getting Help

- Expo docs: https://docs.expo.dev
- Nativewind docs: https://www.nativewind.dev
- Zustand docs: https://docs.pmnd.rs/zustand
- Run `bun run doctor` for Expo environment diagnostics
