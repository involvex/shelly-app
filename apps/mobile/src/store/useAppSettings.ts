import AsyncStorage from '@react-native-async-storage/async-storage'
import type {TerminalThemeKey} from '@/theme/terminal'
import {create} from 'zustand'

const STORAGE_KEY = 'shelly_app_settings'

/** @deprecated Use `AppSettings.fontSize` (number) directly. Kept for migration only. */
export type FontSize = 'small' | 'medium' | 'large'

/** Terminal PTY type — controls the TERM env var and PTY emulation level. */
export type TerminalType =
	| 'xterm-256color'
	| 'xterm'
	| 'vt100'
	| 'vt102'
	| 'vt220'
	| 'ansi'
	| 'vanilla'

export interface AppSettings {
	/** Terminal font size in pixels (8–22). Stored as number; migrates from old 'small'|'medium'|'large'. */
	fontSize: number
	/** SSH keep-alive interval in seconds. 0 = disabled. */
	keepAliveInterval: number
	/** Terminal color theme. */
	terminalTheme: TerminalThemeKey
	/** PTY terminal type. */
	terminalType: TerminalType
}

const DEFAULTS: AppSettings = {
	fontSize: 13,
	keepAliveInterval: 30,
	terminalTheme: 'default',
	terminalType: 'xterm-256color',
}

/** Legacy string→number migration. */
const LEGACY_FONT_SIZES: Record<string, number> = {
	small: 11,
	medium: 13,
	large: 15,
}

/** Font size steps for the settings picker. */
export const FONT_SIZE_STEPS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22]

/** @deprecated Use `settings.fontSize` (number) directly. Kept for backward compat. */
export const FONT_SIZE_MAP: Record<FontSize, number> = {
	small: 11,
	medium: 13,
	large: 15,
}

interface AppSettingsState {
	settings: AppSettings
	loaded: boolean
	load: () => Promise<void>
	update: <K extends keyof AppSettings>(
		key: K,
		value: AppSettings[K],
	) => Promise<void>
}

export const useAppSettings = create<AppSettingsState>((set, get) => ({
	settings: DEFAULTS,
	loaded: false,

	load: async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const merged: any = raw
				? {...DEFAULTS, ...JSON.parse(raw)}
				: {...DEFAULTS}
			// Migrate old string fontSize ('small'|'medium'|'large') → number
			if (typeof merged.fontSize === 'string') {
				merged.fontSize = LEGACY_FONT_SIZES[merged.fontSize as string] ?? 13
			}
			set({settings: merged as AppSettings, loaded: true})
		} catch {
			set({settings: DEFAULTS, loaded: true})
		}
	},

	update: async (key, value) => {
		const next = {...get().settings, [key]: value}
		set({settings: next})
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
		} catch {
			// Non-fatal — settings will reset on next launch but app continues.
		}
	},
}))
