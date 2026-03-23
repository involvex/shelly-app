/**
 * Terminal-specific dark theme tokens.
 *
 * The terminal is ALWAYS dark — these values are independent of the system
 * color scheme and must never be mixed with the app-wide `colors.ts` light/dark
 * system.
 */

export const TERMINAL_COLORS = {
	background: '#0d0d0d',
	surface: '#141414',
	surfaceActive: '#1a1a1a',
	surfaceHover: '#1f1f1f',

	outputText: '#d4d4d4',
	commandText: '#e2e2e2',
	mutedText: '#555555',
	subtleText: '#3a3a3a',

	accent: '#6366f1', // indigo-500
	accentMuted: '#4f46e5', // indigo-600
	accentLight: '#818cf8', // indigo-400

	border: '#2a2a2a',
	borderActive: '#6366f1',
	borderSubtle: '#1e1e1e',

	errorText: '#f87171',
	successText: '#4ade80',
	warningText: '#fbbf24',

	promptColor: '#6366f1',
	hostText: '#a1a1aa',
} as const

export type TerminalColors = typeof TERMINAL_COLORS

export const TERMINAL_FONT = {
	family: 'monospace',
	size: 13,
	lineHeight: 20,
} as const

export const TERMINAL_SPACING = {
	inputPaddingH: 8,
	inputPaddingV: 6,
	outputPaddingH: 10,
	outputPaddingV: 8,
} as const

/** Predefined accent colours the user can assign to SSH profile cards. */
export const PROFILE_COLORS = [
	'#6366f1', // indigo (default)
	'#10b981', // emerald
	'#f59e0b', // amber
	'#ef4444', // red
	'#8b5cf6', // violet
	'#06b6d4', // cyan
	'#ec4899', // pink
	'#84cc16', // lime
] as const

export type ProfileColor = (typeof PROFILE_COLORS)[number]
