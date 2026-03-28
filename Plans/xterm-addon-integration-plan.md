# xterm Addon Integration Plan

## Context

The Shelly app currently has a minimal xterm.js integration in `TerminalView.web.tsx` — only `@xterm/addon-fit` is used, with hardcoded dark theme, outdated CSS CDN reference (v5.3.0 vs installed v6.0.0), and no theme/settings integration. This plan evaluates all official xterm addons for mobile viability and implements the selected ones into the web terminal component.

**Key architectural note:** xterm.js runs only in the **web platform** variant (`TerminalView.web.tsx`). On native (iOS/Android), the app uses `TerminalView.tsx` which is a pure React Native text-based terminal. Addon integration therefore targets the WebView environment where xterm runs. The app currently uses native SSH (not WebSocket), so WebSocket attach is introduced as an optional connection mode for web users.

---

## Addon Evaluation

| Addon                    | Version | Include? | Justification                                                                                                                                                                  |
| ------------------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@xterm/addon-fit`       | 0.11.0  | **Keep** | Already installed. Auto-resizes terminal to container. Works in WebView via DOM dimension reads only.                                                                          |
| `@xterm/addon-web-links` | 0.12.0  | **Yes**  | Buffer-only, no DOM/canvas needed. Needs custom `linkHandler` to bridge `window.open()` → React Native `Linking.openURL()` for native, or standard browser navigation for web. |
| `@xterm/addon-search`    | 0.16.0  | **Yes**  | Pure buffer operations. Works identically in WebView. Enables Ctrl+F search with findNext/findPrevious.                                                                        |
| `@xterm/addon-clipboard` | 0.2.0   | **Yes**  | Supports custom `IClipboardProvider`. Bridge to `expo-clipboard` (already installed) for copy/paste in WebView.                                                                |
| `@xterm/addon-unicode11` | 0.9.0   | **Yes**  | Pure buffer character-width calculations. Zero risk. Improves CJK and emoji rendering.                                                                                         |
| `@xterm/addon-serialize` | 0.14.0  | **Yes**  | Pure buffer read. Enables session persistence via AsyncStorage. Critical for mobile crash recovery.                                                                            |
| `@xterm/addon-progress`  | 0.2.0   | **Yes**  | Parses OSC 9;4 escape sequences. Pure buffer. Can drive native progress indicators for long-running commands.                                                                  |
| `@xterm/addon-webgl`     | 0.19.0  | **No**   | Requires WebGL2 context — unavailable in React Native WebView on iOS/Android. Would crash on load.                                                                             |
| `@xterm/addon-canvas`    | 0.7.0   | **No**   | Canvas2D unreliable in mobile WebViews. Default DOM renderer is more stable. Also stale (no xterm 6.x updates).                                                                |
| `@xterm/addon-image`     | 0.9.0   | **No**   | Heavy Canvas2D dependency, 128MB+ memory for image storage. Completely incompatible with WebView.                                                                              |
| `@xterm/addon-ligatures` | 0.10.0  | **No**   | Requires Node.js `fs` module to read font files. Designed for Electron only.                                                                                                   |

### Summary: 7 addons (1 existing + 6 new), 4 excluded

---

## Implementation Plan

### Step 1: Install addon packages

```bash
bun add -D @xterm/addon-web-links@^0.12.0 @xterm/addon-search@^0.16.0 @xterm/addon-clipboard@^0.2.0 @xterm/addon-unicode11@^0.9.0 @xterm/addon-serialize@^0.14.0 @xterm/addon-progress@^0.2.0
```

All go in `apps/mobile/package.json`. No native linking needed — all are pure JS packages used only in the web variant.

---

### Step 2: Refactor `TerminalView.web.tsx`

**File:** `apps/mobile/src/components/TerminalView.web.tsx`

Major changes:

1. **Fix CSS loading** — load from installed package instead of outdated CDN, or use `@xterm/xterm` CSS import
2. **Integrate terminal themes** — accept theme colors from props, map to xterm `ITerminalOptions['theme']`
3. **Integrate font size settings** — accept `fontSize` prop from parent
4. **Load all 6 new addons** with proper configuration
5. **Custom clipboard provider** bridging `expo-clipboard`
6. **Custom link handler** for URL opening
7. **Progress event handling** — emit progress state up to parent
8. **Serialization support** — expose `serialize()`/`deserialize()` methods via ref
9. **Search bar UI** — floating search overlay with findNext/findPrevious and mobile-friendly controls

**Props interface (expanded):**

```typescript
interface TerminalViewProps {
	onData: (data: string) => void
	output: string
	theme: TerminalThemeKey
	colors: {
		background: string
		foreground: string
		cursor: string
		// ... xterm theme mappings
	}
	fontSize: number
	onProgress?: (progress: number | null) => void
	enableSearch?: boolean
	onSerialize?: (state: string) => void
	savedState?: string | null
}
```

**Addon initialization order:**

```typescript
// 1. FitAddon (already works)
// 2. Unicode11Addon (before web-links, affects width calculations)
// 3. WebLinksAddon (with custom linkHandler)
// 4. SearchAddon (pure buffer)
// 5. ClipboardAddon (with custom IClipboardProvider)
// 6. ProgressAddon (with onChange callback)
// 7. SerializeAddon (loaded last, reads full buffer state)
```

---

### Step 3: Clipboard Provider Bridge

Create `apps/mobile/src/lib/xterm-clipboard-provider.ts`:

```typescript
import type {IClipboardProvider} from '@xterm/addon-clipboard'
import * as Clipboard from 'expo-clipboard'

export const expoClipboardProvider: IClipboardProvider = {
	readText: async () => Clipboard.getStringAsync(),
	writeText: async (text: string) => Clipboard.setStringAsync(text),
}
```

This uses `expo-clipboard` which is already a dependency (`55.0.10-canary`). The provider works on both native and web platforms since expo-clipboard has web support.

---

### Step 4: Link Handler Bridge

Create `apps/mobile/src/lib/xterm-link-handler.ts`:

```typescript
import {Linking, Platform} from 'react-native'

export function createLinkHandler() {
	return {
		activate: (_event: MouseEvent, uri: string) => {
			if (Platform.OS === 'web') {
				window.open(uri, '_blank', 'noopener,noreferrer')
			} else {
				Linking.openURL(uri)
			}
		},
	}
}
```

---

### Step 5: Search UI Component

Create `apps/mobile/src/components/terminal/SearchBar.tsx`:

A floating search overlay (web-only) that:

- Toggles via Ctrl+F or a toolbar button
- Has a text input for search query
- Prev/Next navigation buttons (touch-friendly, min 44px tap targets)
- Case-sensitive toggle
- Match count display
- Close button
- Uses `SearchAddon`'s `findNext()`/`findPrevious()` API
- Positioned absolutely over the terminal area

This component is rendered only on web (co-located with `TerminalView.web.tsx` or conditionally imported).

---

### Step 6: Serialization for State Persistence

Wire up `SerializeAddon` in the terminal lifecycle:

- **On disconnect/background:** Call `serializeAddon.serialize()` → save to `AsyncStorage` via a callback prop
- **On reconnect/mount:** Check for saved state → call `terminal.write(savedState)` to restore
- **Storage key:** `shelly_terminal_state_{host}:{port}` (per-session)
- **Size limit:** Cap at 500KB to avoid AsyncStorage bloat; truncate oldest output if exceeded

The parent component (`terminal.tsx`) manages persistence via the `onSerialize` and `savedState` props.

---

### Step 7: Progress Bar Integration

Wire up `ProgressAddon`:

- Listen to `onChange` events → emit to parent via `onProgress` callback
- Parent can display a native progress bar in the terminal header when active
- Progress resets to `null` on next command prompt
- Non-intrusive: only shows when the remote shell sends OSC 9;4 sequences

---

### Step 8: Theme Integration

Map existing `TERMINAL_THEMES` to xterm `ITheme`:

```typescript
function toXtermTheme(colors: TerminalColors): ITheme {
	return {
		background: colors.background,
		foreground: colors.outputText,
		cursor: colors.accent,
		cursorAccent: colors.background,
		selectionBackground: colors.accentMuted + '40', // with alpha
		black: '#000000',
		red: colors.errorText,
		green: colors.successText,
		yellow: colors.warningText,
		blue: colors.accent,
		magenta: colors.accentMuted,
		cyan: colors.accentLight,
		white: colors.outputText,
		brightBlack: colors.mutedText,
		// ... remaining ANSI colors derived from theme
	}
}
```

Apply via `terminal.options.theme` reactively when the user changes themes in settings.

---

### Step 9: WebSocket Attach (Optional Connection Mode)

**Note:** The app currently uses native SSH (`@dylankenneally/react-native-ssh-sftp`) on iOS/Android and `MockSSHService` on web. WebSocket attach is a **new feature** for connecting to remote shell servers over WebSocket (e.g., `wss://server:port/shell`), primarily useful on web where native SSH isn't available.

Implementation:

- Create `apps/mobile/src/services/WebSocketSSHService.ts` implementing `ISSHService`
- Uses browser `WebSocket` API (web-only)
- Connects to a user-provided WebSocket URL
- Sends/receives terminal data over the socket
- Maps WebSocket events to the existing `ISSHService` interface (`onData`, `onError`, `onClose`)
- Add "WebSocket" option to the connection form (alongside existing SSH)
- The `TerminalView.web.tsx` component is connection-agnostic — it receives `output` and `onData` regardless of transport

---

### Step 10: Update `terminal.tsx` Parent Component

Pass new props to `TerminalView`:

- Theme colors from `TERMINAL_THEMES[appSettings.terminalTheme]`
- Font size from `FONT_SIZE_MAP[appSettings.fontSize]`
- `onProgress` handler for progress bar display
- `savedState`/`onSerialize` for session persistence
- Search toggle state

Platform check: The web variant gets the full xterm addon experience; native continues using the existing text-based terminal unchanged.

---

## Files to Create/Modify

| File                                                | Action             | Purpose                                                               |
| --------------------------------------------------- | ------------------ | --------------------------------------------------------------------- |
| `apps/mobile/package.json`                          | Modify             | Add 6 new @xterm/\* dependencies                                      |
| `apps/mobile/src/components/TerminalView.web.tsx`   | **Major refactor** | Full addon integration, theme, search, clipboard, serialize, progress |
| `apps/mobile/src/lib/xterm-clipboard-provider.ts`   | **Create**         | IClipboardProvider bridging expo-clipboard                            |
| `apps/mobile/src/lib/xterm-link-handler.ts`         | **Create**         | Custom link handler for URL opening                                   |
| `apps/mobile/src/components/terminal/SearchBar.tsx` | **Create**         | Mobile-friendly search overlay UI                                     |
| `apps/mobile/src/services/WebSocketSSHService.ts`   | **Create**         | WebSocket-based SSH service for web                                   |
| `apps/mobile/src/app/terminal.tsx`                  | **Modify**         | Pass new props, handle progress/persistence                           |

---

## Platform Considerations

- **Web (Expo Web):** Full xterm.js with all addons. DOM renderer (no WebGL). WebSocket SSH available.
- **iOS/Android (Native):** No changes to native terminal. xterm addons don't apply. `expo-clipboard` bridges natively.
- **Expo Go:** Mock SSH service continues to work. xterm addons load only in web variant.
- **Performance:** DOM renderer is the only viable option for WebView. Unicode11 may add slight overhead for CJK but is negligible. Serialize reads buffer on-demand (not continuously).

---

## Verification

1. `bun run typecheck` — ensure no type errors
2. `bun run lint` — ensure ESLint passes
3. `bun run build` — ensure monorepo builds
4. Manual web test: `bun run -F @shelly/mobile web`
   - Verify terminal renders with correct theme
   - Test Ctrl+F search (type query, press Enter for next, Shift+Enter for prev)
   - Test clickable URLs in terminal output
   - Test copy/paste (select text, Ctrl+C/Ctrl+V)
   - Test CJK characters and emojis render at correct widths
   - Verify session serialization (disconnect, reconnect, check state restored)
   - Verify progress bar appears when remote sends OSC 9;4 sequences
