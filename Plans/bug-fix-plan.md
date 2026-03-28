# Bug Fix Plan: SSH Terminal Client Issues

## Context

The Shelly SSH terminal client has 6 reported issues ranging from broken SSH connections on Windows to UI layout problems and non-functional toolbar buttons. This plan addresses each issue with root cause analysis and specific fixes.

---

## Issue 1: Windows SSH Connection Hangs After `stty`/`export` Output

**File**: `apps/mobile/src/services/SSHService.ts:72-78`

**Root Cause**: Race condition. A hardcoded 300ms `setTimeout` fires `stty` and `export` commands before the remote shell (especially PowerShell on Windows) has finished initializing. PowerShell profile loading, PSReadLine setup, and module imports can take 1-3+ seconds. The `stty`/`export` commands arrive while the shell is mid-initialization, causing them to be lost or corrupt the terminal state.

Additionally, `this._isConnected = true` is set at line 80 — AFTER the setTimeout is registered. The setTimeout callback checks `this._isConnected` at line 73, which should be true by the time it fires (300ms later). But the real issue is the 300ms is simply too short for Windows.

**Fix**: Replace the fixed 300ms timeout with a readiness-based approach. The shell output listener at line 55 already receives data. Track when the first output arrives (indicating shell is ready), then send setup commands. Add a fallback timeout for shells that don't produce prompt output immediately.

```typescript
// In connect(), after startShell():
let shellReady = false
const originalListeners = this.dataListeners

// One-shot readiness detector
const readyCheck = (data: string) => {
	if (data.length > 0) shellReady = true
}
this.dataListeners = [readyCheck, ...originalListeners]

const setupCmd = `stty cols ${cols} rows ${rows} 2>/dev/null; export TERM=xterm-256color; export GIT_TERMINAL_PROMPT=0\r`

const trySetup = (attempt = 0) => {
	if (attempt >= 10) {
		// Give up after ~5s, restore listeners
		this.dataListeners = originalListeners
		return
	}
	setTimeout(
		() => {
			if (!this.client || !this._isConnected) return
			if (shellReady || attempt >= 5) {
				// Shell ready OR forced after 5 retries
				this.client.writeToShell(setupCmd).catch(() => {})
				this.dataListeners = originalListeners
			} else {
				trySetup(attempt + 1)
			}
		},
		attempt < 3 ? 500 : 1000,
	)
}
trySetup()
```

---

## Issue 2: Input Field Obscures Terminal Output When Keyboard Opens

**File**: `apps/mobile/src/app/terminal.tsx:894-897` (styles)

**Root Cause**: When the on-screen keyboard opens, `paddingBottom` is set to `keyboardHeight` on the `kavFlex` container. The `terminalBody` child has `flex: 1` which claims all remaining space. React Native's flex layout doesn't shrink flex children based on the parent's `paddingBottom` — padding adds to the parent's total size. So `terminalBody` renders at full height while the toolbar sits on top, covering the terminal output area.

**Fix**: Add `overflow: 'hidden'` to the `kavFlex` style so content is clipped at the padding boundary:

```typescript
kavFlex: {
    flex: 1,
    overflow: 'hidden',  // ← Add this
},
```

This forces the flex children to fit within the visible area minus paddingBottom.

---

## Issue 3: Preset Saving Broken (Form Flickering + Data Loss)

**Files**: `apps/mobile/src/components/ProfileFormModal.tsx:106-129`, `apps/mobile/src/app/terminal.tsx:75-82`

**Root Cause (Flickering)**: The `useEffect` at line 106-129 of `ProfileFormModal.tsx` depends on `initialSecrets`:

```typescript
useEffect(() => {
	// ... resets entire form
}, [visible, initialProfile, initialSecrets])
```

In `terminal.tsx`, `editingSecrets` is passed as `initialSecrets` without memoization. Every time the parent re-renders (e.g., user typing in the form triggers a store update), `editingSecrets` gets a new object reference (even though content is identical). This triggers the `useEffect`, which **resets the entire form to initial values**, wiping all user edits. The visual result is rapid flickering as the form state is constantly overwritten.

**Fix for Flickering**: Only reset form when `visible` changes from false→true. Use a separate `useRef` to track whether the form has been initialized for the current `visible` cycle:

```typescript
const initializedRef = useRef(false)

useEffect(() => {
    if (!visible) {
        initializedRef.current = false
        return
    }
    if (initializedRef.current) return  // Already populated for this open
    initializedRef.current = true
    // ... existing form population logic
    if (initialProfile) { ... } else { setForm(EMPTY) }
    setErrors({})
    setSaving(false)
}, [visible])
```

Remove `initialProfile` and `initialSecrets` from the dependency array. This prevents re-populating the form while the user is editing, while still loading correct data when the modal first opens.

**Root Cause (Data Not Persisted)**: The save flow itself (`useSSHProfiles.add/update`) correctly writes to AsyncStorage. The persistence was working but the form reset bug caused users to lose edits before saving, making it appear that saves didn't persist.

---

## Issue 4: Default Command on Connection (Feature Request)

**File**: `apps/mobile/src/app/terminal.tsx:98-107`

**Current State**: The `startupCommand` feature already exists in the profile schema (`SSHProfile.startupCommand`) and is partially wired in `terminal.tsx`. However, there's no "Startup Command" field on the Quick Connect form — only on the Profile Form (under Advanced Options).

**Root Cause of Non-Functionality**: The startup command fires at a fixed 500ms delay after `isConnected` becomes true (line 103). Combined with Issue 1 (shell not ready), this command may execute before the shell is interactive.

**Fix**:

1. The timing issue is resolved by fixing Issue 1 (readiness-based setup).
2. Add a `startupCommand` field to the Quick Connect form in `terminal.tsx` so users can specify it without creating a profile.
3. Ensure the `startupCommandRef` pattern works correctly — it already fires at 500ms after `isConnected` changes, which should be fine once Issue 1 is fixed.

Changes to `terminal.tsx`:

- Add a `startupCommand` state variable
- Add a TextInput for it in the Quick Connect form (after the Password field)
- Pass it through `handleConnect` → store → `startupCommandRef`

---

## Issue 5: Network Scanning Fails to Detect Devices

**File**: `apps/mobile/src/store/useDiscoveryStore.ts`

**Root Cause**: The scanning logic is sound. The likely causes for "never detects any devices" are:

1. **Running in Expo Go**: The store checks `Constants.executionEnvironment === 'storeClient'` and shows an error message, but the `scanError` styling in `terminal.tsx` uses red error text (`#f87171`), making it look like a failure rather than informational.
2. **Missing native modules**: `expo-network` and `react-native-tcp-socket` require dev builds. In Expo Go, `Network` and `TcpSocket` are `null`, so `probePort` always returns `false`.
3. **Network permissions**: Android 13+ requires `NEARBY_WIFI_DEVICES` permission.

**Fix**: The code already handles these cases with informative error messages. The real issue is UX: when no hosts are found (line 304-309), `scanError` is set with a multi-line troubleshooting message that's displayed as red error text. This makes "no devices found" look like a bug rather than a normal outcome.

Changes:

- In `terminal.tsx`, when `scanError` contains "no reachable SSH devices", render it as muted/gray text instead of red error text
- Add a dedicated style for informational messages vs error messages

---

## Issue 6: On-Screen Toolbar Buttons Non-Functional

**File**: `apps/mobile/src/components/TerminalToolbar.tsx:56-61`

**Root Cause**: The toolbar buttons send correct escape sequences (`\x1b[A` for Up, `\t` for Tab, etc.) via `onSend → sendData → service.write → client.writeToShell`. The data reaches the remote PTY. However, two problems make them appear non-functional:

1. **Native terminal strips all ANSI**: `TerminalView.tsx` (native) runs all output through `processOutput()` which strips ALL ANSI escape sequences including cursor movement responses. When the user presses the Up arrow toolbar button, `\x1b[A` is sent to the server, the server responds with cursor movement codes, but those codes are stripped from the displayed output. The user sees no visible effect.

2. **No local echo of special keys**: Unlike regular character input which the mock service echoes back, escape sequences for arrow keys have no local visual feedback in the native terminal.

3. **Missing Ctrl+C/D/Z**: Common process control shortcuts (Ctrl+C for interrupt, Ctrl+D for EOF, Ctrl+Z for suspend) are absent from the toolbar.

**Fix**:

1. Add Ctrl+C, Ctrl+D, Ctrl+Z buttons to the toolbar for process control
2. Add visual feedback (brief highlight) when a toolbar button is pressed
3. The underlying ANSI stripping in native mode is an architectural limitation — arrow keys work on the remote shell (command history navigation, cursor movement within a line) but the visual feedback requires the remote shell to send back visible output. This is correct behavior for SSH; the toolbar is functional, but the effect may not be immediately visible in all scenarios.

---

## Files to Modify

| File                                              | Changes                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/mobile/src/services/SSHService.ts`          | Readiness-based stty/export setup instead of fixed 300ms timeout                                |
| `apps/mobile/src/app/terminal.tsx`                | Add `overflow: 'hidden'` to kavFlex; add startupCommand to Quick Connect; fix scanError styling |
| `apps/mobile/src/components/ProfileFormModal.tsx` | Fix useEffect dependency to only reset on `visible` change                                      |
| `apps/mobile/src/components/TerminalToolbar.tsx`  | Add Ctrl+C, Ctrl+D, Ctrl+Z buttons; wrap clipboard in try/catch                                 |

---

## Verification

1. `bun run typecheck` — ensure no type errors
2. `bun run lint` — ensure ESLint passes
3. Manual test: connect to a Windows SSH host — shell should initialize fully before stty/export commands are sent
4. Manual test: open keyboard on mobile — terminal output should remain visible above the input field
5. Manual test: create/edit a profile — form should not flicker, edits should persist
6. Manual test: press Ctrl+C on toolbar — should send `\x03` to remote shell
