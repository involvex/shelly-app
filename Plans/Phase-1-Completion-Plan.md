# Phase 1 Completion Plan: SSH Terminal App (Expo Go)

## Objective

Complete the "Phase 1" features for the Shelly SSH Terminal App, focusing on a robust mock environment that runs in Expo Go. This involves fixing critical bugs in terminal emulation, completing the UI for snippets and settings, and implementing missing keyboard functionality.

## 1. Bug Fixes

### 1.1 Fix Duplicate Output in Terminal

**Problem:** `useSSHStore` accumulates `output` string, and `TerminalView` sends the _entire_ string to xterm.js on every update. This causes duplication and performance issues.
**Solution:**

- Modify `useSSHStore` to expose an event-based subscription for _new_ data, rather than just state.
- Alternatively, keep `output` in state for restoration but use a transient event emitter for live updates.
- Update `TerminalView` to only write _new_ chunks to xterm.js.

## 2. Feature Implementation

### 2.1 Terminal Toolbar Improvements

**Goal:** Make the "Ctrl" key functional.
**Implementation:**

- Add `isCtrlActive` state to `TerminalToolbar`.
- Visual indicator when Ctrl is active (e.g., highlight button).
- When Ctrl is active, the next key press should send the control code (e.g., `Ctrl+C` -> `\x03`) and deactivate Ctrl.
- Update `buttons` list to support dynamic codes based on modifier state.

### 2.2 Snippet Management UI

**Goal:** Allow users to add and remove snippets directly from the overlay.
**Implementation:**

- Add "Add Snippet" button to `SnippetOverlay`.
- Create a simple form (Modal or inline) to enter Name and Command.
- Add "Delete" button/icon to each snippet item.
- Connect to `useSnippetStore` actions (`addSnippet`, `removeSnippet`).

### 2.3 Settings Screen

**Goal:** Allow users to customize terminal appearance.
**Implementation:**

- Create `apps/mobile/src/app/settings.tsx`.
- Add options for:
  - Font Size (10px - 24px)
  - Color Theme (Dark/Light/High Contrast)
  - Cursor Blink (On/Off)
- Persist settings using `async-storage` (create `useSettingsStore`).
- Connect settings to `TerminalView` (pass as props/inject into WebView).

### 2.4 Mock Windows Hello Auth

**Goal:** Simulate biometric authentication flow before connecting.
**Implementation:**

- Update `MockSSHService` to optionally require a "biometric" challenge.
- In `TerminalScreen`, if auth type is "biometric", show a mock "Scan Fingerprint/Face" modal before calling `connect`.

## 3. Refactoring & Cleanup

- Ensure `MockSSHService` accurately simulates a PowerShell environment (e.g., prompt handling, basic commands like `dir`, `cls`).
- Type safety improvements in `shared` package if needed.

## Execution Order

1.  **Fix Duplicate Output** (Critical for usability)
2.  **Toolbar Ctrl Key** (High priority for terminal usage)
3.  **Snippet Management** (Medium priority)
4.  **Settings Screen** (Low priority polish)
