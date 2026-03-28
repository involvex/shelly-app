# Fix Plan: Metro "self is not defined" + TCP Socket Native Crash

## Root Causes

### Error 1: `self is not defined` (Metro bundler)

**File**: `apps/mobile/src/app/terminal.tsx:20`

```typescript
import type {IProgressState} from '@xterm/addon-progress'
```

Babel-preset-expo sets `onlyRemoveTypeImports: true`, which means `import type { X } from 'mod'` is fully removed, but `import { type X, Y } from 'mod'` only strips the type specifier — the bare `import 'mod'` remains. In this case, the `import type` IS fully removed by Babel, but Metro's module resolution still processes `@xterm/addon-progress` because the xterm packages are in `dependencies` and Metro follows the dependency graph.

The real issue: Metro bundles ALL files for the native platform. Even though `TerminalView.web.tsx` is excluded from native builds (Metro skips `.web.tsx`), the xterm packages themselves are still in `node_modules` and Metro may try to process them during dependency resolution.

**Fix**: Two-pronged approach:

1. Remove the `import type` from `terminal.tsx` — define the trivial type inline instead
2. Add a Metro resolver that returns an empty module for `@xterm/*` on non-web platforms

### Error 2: `No socket with id 95` (native crash)

**File**: `apps/mobile/src/store/useDiscoveryStore.ts:117-165`

The `probePort` function creates TCP sockets and destroys them on timeout/connect/error. `react-native-tcp-socket`'s Java layer (`TcpSocketModule`) processes socket operations on a background thread pool. When `socket.destroy()` is called:

1. JS sends a `destroy` message to the native bridge
2. The native module removes the socket from its internal map
3. But the thread pool may still have a pending `connect` or `data` operation queued that references the now-removed socket ID
4. When that queued operation executes, `getTcpClient(socketId)` throws `IllegalArgumentException`

The scan creates 24 concurrent sockets per batch × ~11 batches = ~264 sockets, many of which timeout and get destroyed while others are still being created. This maximizes the race window.

**Fix**:

1. Use `socket.end()` instead of `socket.destroy()` — `end()` sends FIN for graceful shutdown
2. Wrap `socket.end()`/`socket.destroy()` in `setImmediate()` to defer cleanup past the current native operation
3. Remove all listeners before destroying to prevent callbacks from firing on a half-dead socket
4. Add `socket.on('close', ...)` as the authoritative cleanup point

---

## Files to Modify

| File                                         | Change                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/mobile/src/app/terminal.tsx`           | Remove `import type {IProgressState}` from xterm; define type inline    |
| `apps/mobile/metro.config.js`                | Add resolver to return empty module for `@xterm/*` on non-web platforms |
| `apps/mobile/src/store/useDiscoveryStore.ts` | Fix socket cleanup in `probePort` to prevent native crash               |

---

## Verification

1. `bun run typecheck` — no type errors
2. `bun run lint` — no lint errors
3. Run on Android device — Metro should bundle without "self is not defined"
4. Tap "Rescan" in discovery — scan completes without native crash
