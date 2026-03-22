# Project Overview

This is a monorepo project, `shelly-app`, primarily focused on mobile development using Expo and React Native, with a potential web build target. The core functionality appears to be an SSH/SFTP client. The project utilizes Bun as its JavaScript runtime and package manager.

## Technologies Used

- **Runtime/Package Manager:** Bun
- **Mobile Development:** Expo, React Native
- **Styling:** Nativewind (Tailwind CSS for React Native), Radix UI (for web components), Tailwind CSS
- **State Management:** Zustand
- **Terminal Emulation:** Xterm.js
- **Linting:** ESLint (Flat Config with TypeScript, React, and CSS plugins)
- **Formatting:** Prettier
- **TypeScript:** Used throughout the project.

## Project Structure

The project follows a monorepo structure:

- `apps/mobile`: Contains the main Expo/React Native application.
- `packages/shared`: A shared package likely containing common utilities or components used across apps.

## Getting Started

### Installation

To install project dependencies:

```bash
bun install
```

### Building

To build the shared package and the mobile application:

```bash
bun run build
```

This command runs:

- `bun run build:shared`: Builds the `packages/shared` package.
- `bun run build:app`: Runs `expo prebuild` for the `apps/mobile` project.

### Running the Mobile App

To start the Expo development server for the mobile application:

```bash
bun run start:app
```

To run on a specific platform:

```bash
# For Android
bun run android

# For iOS
bun run ios

# For Web (Expo development server)
bun run web
```

### Code Quality

The project uses ESLint for linting and Prettier for code formatting.

- **Format Code:**

  ```bash
  bun run format
  ```

- **Lint Code:**

  ```bash
  bun run lint
  ```

- **Fix Linting Issues:**

  ```bash
  bun run lint:fix
  ```

- **Type Checking:**

  ```bash
  bun run typecheck
  ```

## Development Conventions

- **Linting:** ESLint is configured with a Flat Config setup, including rules for TypeScript, React, and CSS. Specific directories and files (like `node_modules`, build outputs, agent-related folders, and `tailwind.config.js`) are ignored. React version for linting is set to 19.0.
- **Formatting:** Prettier is used for consistent code formatting across the project.
- **Pre-build Checks:** The `prebuild` script ensures code is formatted, linted, and type-checked before a build is initiated.
- **Monorepo:** The project leverages Bun workspaces for managing multiple packages within a single repository.
