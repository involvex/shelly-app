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

export type TerminalColors = {
	background: string
	surface: string
	surfaceActive: string
	surfaceHover: string
	outputText: string
	commandText: string
	mutedText: string
	subtleText: string
	accent: string
	accentMuted: string
	accentLight: string
	border: string
	borderActive: string
	borderSubtle: string
	errorText: string
	successText: string
	warningText: string
	promptColor: string
	hostText: string
}

/** Named theme keys available in Settings. */
export type TerminalThemeKey =
	| 'default'
	| 'dracula'
	| 'monokai'
	| 'solarized-dark'
	| 'one-dark'
	| 'nord'

export interface TerminalTheme {
	key: TerminalThemeKey
	label: string
	/** Accent swatch shown in the theme picker. */
	preview: string
	colors: TerminalColors
}

export const TERMINAL_THEMES: Record<TerminalThemeKey, TerminalTheme> = {
	default: {
		key: 'default',
		label: 'Default',
		preview: '#6366f1',
		colors: TERMINAL_COLORS,
	},
	dracula: {
		key: 'dracula',
		label: 'Dracula',
		preview: '#bd93f9',
		colors: {
			background: '#282a36',
			surface: '#343746',
			surfaceActive: '#3d4059',
			surfaceHover: '#44475a',
			outputText: '#f8f8f2',
			commandText: '#f8f8f2',
			mutedText: '#6272a4',
			subtleText: '#44475a',
			accent: '#bd93f9',
			accentMuted: '#ff79c6',
			accentLight: '#caa9fa',
			border: '#44475a',
			borderActive: '#bd93f9',
			borderSubtle: '#3d3f5c',
			errorText: '#ff5555',
			successText: '#50fa7b',
			warningText: '#f1fa8c',
			promptColor: '#bd93f9',
			hostText: '#8be9fd',
		},
	},
	monokai: {
		key: 'monokai',
		label: 'Monokai',
		preview: '#a6e22e',
		colors: {
			background: '#272822',
			surface: '#3e3d32',
			surfaceActive: '#4d4c42',
			surfaceHover: '#75715e',
			outputText: '#f8f8f2',
			commandText: '#f8f8f2',
			mutedText: '#75715e',
			subtleText: '#49483e',
			accent: '#a6e22e',
			accentMuted: '#66d9e8',
			accentLight: '#e6db74',
			border: '#49483e',
			borderActive: '#a6e22e',
			borderSubtle: '#3e3d32',
			errorText: '#f92672',
			successText: '#a6e22e',
			warningText: '#e6db74',
			promptColor: '#a6e22e',
			hostText: '#66d9e8',
		},
	},
	'solarized-dark': {
		key: 'solarized-dark',
		label: 'Solarized Dark',
		preview: '#268bd2',
		colors: {
			background: '#002b36',
			surface: '#073642',
			surfaceActive: '#0d4253',
			surfaceHover: '#094152',
			outputText: '#839496',
			commandText: '#93a1a1',
			mutedText: '#586e75',
			subtleText: '#073642',
			accent: '#268bd2',
			accentMuted: '#2aa198',
			accentLight: '#b58900',
			border: '#073642',
			borderActive: '#268bd2',
			borderSubtle: '#073642',
			errorText: '#dc322f',
			successText: '#859900',
			warningText: '#b58900',
			promptColor: '#268bd2',
			hostText: '#2aa198',
		},
	},
	'one-dark': {
		key: 'one-dark',
		label: 'One Dark',
		preview: '#61afef',
		colors: {
			background: '#21252b',
			surface: '#282c34',
			surfaceActive: '#2c313c',
			surfaceHover: '#3a3f4b',
			outputText: '#abb2bf',
			commandText: '#c8ccd4',
			mutedText: '#5c6370',
			subtleText: '#3a3f4b',
			accent: '#61afef',
			accentMuted: '#528bff',
			accentLight: '#56b6c2',
			border: '#3e4451',
			borderActive: '#61afef',
			borderSubtle: '#282c34',
			errorText: '#e06c75',
			successText: '#98c379',
			warningText: '#e5c07b',
			promptColor: '#61afef',
			hostText: '#e5c07b',
		},
	},
	nord: {
		key: 'nord',
		label: 'Nord',
		preview: '#88c0d0',
		colors: {
			background: '#2e3440',
			surface: '#3b4252',
			surfaceActive: '#434c5e',
			surfaceHover: '#4c566a',
			outputText: '#d8dee9',
			commandText: '#e5e9f0',
			mutedText: '#4c566a',
			subtleText: '#3b4252',
			accent: '#88c0d0',
			accentMuted: '#81a1c1',
			accentLight: '#8fbcbb',
			border: '#434c5e',
			borderActive: '#88c0d0',
			borderSubtle: '#3b4252',
			errorText: '#bf616a',
			successText: '#a3be8c',
			warningText: '#ebcb8b',
			promptColor: '#88c0d0',
			hostText: '#b48ead',
		},
	},
}

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
