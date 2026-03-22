# SSH PowerShell Terminal App Plan

## Objective

Build a robust, seamless SSH client for Android to connect to Windows PowerShell.
**Constraint:** Must support **Expo Go** for initial UI/UX testing.
**Reality Check:** Direct SSH (TCP) is **impossible** in standard Expo Go due to OS security sandboxing.
**Solution:** A **Hybrid Development Strategy**:

1.  **Expo Go (UI Phase):** Use a **Mock SSH Engine** (Echo/Dummy shell) to build the Terminal, Toolbar, Snippets, and Settings UI without native code.
2.  **Dev Client (Real Phase):** Run `npx expo prebuild` to enable **Native TCP Sockets** and **SSH Bindings** for the actual connection.

## Technology Stack

- **Runtime & PM:** **Bun**.
- **Framework:** React Native (Expo SDK 50+).
- **Styling:** **NativeWind** (Tailwind) + **Expo Router**.
- **SSH Engine (Abstracted):**
  - _Mock Provider:_ Fakes a shell for Expo Go.
  - _Real Provider:_ `@dylankenneally/react-native-ssh-sftp` (requires Prebuild).
- **Clipboard:** `expo-clipboard`.
- **Terminal:** `react-native-webview` + `xterm.js`.

## Architecture

### 1. Project Structure (Monorepo)

- **Packages:**
  - `packages/shared`: Types, Constants, Snippets.
  - `packages/mock-ssh`: Fake shell logic (for Expo Go).
- **Apps:**
  - `apps/mobile`: Main Expo app.

### 2. Core Components

- **TerminalScreen:**
  - Uses `react-native-webview` (works in Expo Go).
  - Hosting `xterm.js`.
- **KeyboardToolbar:**
  - NativeWind styled view.
  - Keys: Tab, Arrows, Ctrl, etc.
- **Service Layer:**
  - `SSHService` interface.
  - Implementations: `MockSSHService`, `NativeSSHService`.

## Features

### Phase 1: Expo Go (UI & Logic)

- **Terminal UI:** Full xterm.js integration (typing, resizing, colors).
- **Toolbar:** Functional "Tab", "Arrows" (sending codes to xterm).
- **Clipboard:** "Paste" button using `expo-clipboard`.
- **Snippets System:** UI to save/recall snippets (stored in `async-storage`).
- **Settings:** Theme selection (NativeWind), Font size.
- **Windows Hello (Mocked):** UI flow for biometric auth (actual auth mocked).

### Phase 2: Native Integration (Prebuild)

- **Real SSH:** Swap Mock Service with `@dylankenneally/react-native-ssh-sftp`.
- **Real Biometrics:** Enable `expo-local-authentication`.
- **Volume Keys:** Enable `react-native-keyevent` (requires native).
- **TCP/Discovery:** Enable `react-native-zeroconf` / TCP sockets.

## Implementation Steps

1.  **Repo Setup:** Fix `tsconfig.json` paths and Bun workspace.
2.  **Shared Package:** Create `packages/shared` with SSH interfaces.
3.  **UI Implementation (Expo Go):**
    - Implement `TerminalScreen` with Mock SSH.
    - Implement Toolbar & Clipboard.
    - Implement Snippets UI.
4.  **Native Transition:**
    - Run `npx expo prebuild`.
    - Install Native SSH & Biometric libraries.
    - Verify Real Connection.

## Verification

- **Expo Go:** App opens, "Connect" enters a fake shell. Typing works. Snippets paste text.
- **Prebuild:** App builds. "Connect" connects to real Windows PC.

## Why this approach?

It allows rapid UI iteration in Expo Go (as requested) while acknowledging that real SSH is a native capability.
