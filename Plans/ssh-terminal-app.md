# SSH PowerShell Terminal App Plan

## Objective

Build a robust, seamless SSH client for Android to connect to Windows PowerShell, featuring native command execution, PowerShell completions, and Git support with GitHub credentials. Inspired by **Tabby** and **Termius**, aiming for a clean, configurable "hacker" UI.

## Technology Stack

- **Runtime & PM:** **Bun** (for package management and scripting).
- **Framework:** React Native (Expo SDK 50+ / Development Build).
- **SSH Client:** `@dylankenneally/react-native-ssh-sftp` (Native libssh2 bindings).
- **Terminal Rendering:** `react-native-webview` + `@xterm/xterm`.
- **State Management:** `zustand`.
- **Storage:** `expo-secure-store` (Keys/Passwords), `async-storage` (Settings/History).
- **Discovery:** `react-native-zeroconf` (or similar) for local SSH device detection.

## Architecture

### 1. Project Structure (Monorepo)

```
packages/
  shared/ (Types, constants, snippets)
apps/
  mobile/ (Expo app)
```

### 2. Core Components

- **ConnectionManager:** Handles SSH connection, keep-alives, and port forwarding.
- **TerminalView:** WebView wrapper for `xterm.js`.
- **HardwareInputManager:** Intercepts Volume Keys for custom actions (e.g., specific hotkeys).
- **SnippetEngine:** Manages custom autocomplete snippets and command history.

## Features

### Connection & Identity Management

- **Hosts List:** Save/Edit/Group connections.
- **Keychain:** Securely store SSH Keys (PEM/OpenSSH), Certificates, and Passwords.
- **Known Hosts:** Manage trusted host keys to prevent MITM.
- **Local Discovery:** Scan local network for SSH services (mDNS/BonJour).

### Terminal Experience

- **PowerShell Compatibility:** Full PTY support (resize, colors).
- **Custom Hotkeys:**
  - Configurable on-screen toolbar (Tab, Esc, Ctrl, etc.).
  - **Volume Button Mapping:** Map Volume Up/Down to specific keys (e.g., Up/Down arrows, or Tab/Enter).
- **Autocomplete & Snippets:**
  - Built-in PowerShell common commands.
  - User-defined snippets (e.g., "git status", "npm run dev") reachable via a quick menu.
- **Shell History:** Persistent local history of commands run.

### Git/GitHub Support

- **Standard Remote Auth:** Optimized UI for handling auth prompts.
- **Clipboard Integration:** "Smart Paste" for tokens.

## Implementation Steps

1.  **Scaffold Project:** Initialize `apps/mobile` using **Bun** and Expo.
2.  **Native Modules Setup:** Configure SSH, WebView, and **Volume Key Listener**.
3.  **UI Construction:** Build the Terminal Screen with the custom Toolbar and Snippet overlay.
4.  **SSH & Key Management:** Implement the Key Store and Connection logic.
5.  **Discovery:** Implement local network scanning.
6.  **Advanced Input:** Wire up Volume Keys to terminal actions.

## Verification

- **Bun:** Verify `bun install` and scripts work.
- **SSH:** Connect to Windows using a Private Key.
- **Input:** Verify Volume Keys trigger assigned actions (e.g., Arrow Up/Down).
- **Snippets:** Verify custom snippets inject text into the shell.
- **Discovery:** Verify local devices appear in the list.

## Extra

- windows hello for secure keygen
