// Polyfill browser globals that third-party packages (e.g. @xterm/xterm) rely on
// but that are absent in the React Native / Metro JavaScript environment.
// Import this file as the FIRST import in any module that transitively pulls in
// such packages so the polyfill is evaluated before those modules initialise.

if (typeof globalThis.self === 'undefined') {
	// 'self' is a read-only global alias of 'window' in browsers and of the
	// global scope in Web Workers.  xterm.js references it at the top level of
	// its UMD/ESM bundle.  Without this, Metro throws "self is not defined"
	// when the module factory runs.
	;(globalThis as Record<string, unknown>).self = globalThis
}
