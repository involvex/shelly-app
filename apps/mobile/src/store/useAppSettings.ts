import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'

const STORAGE_KEY = 'shelly_app_settings'

export type FontSize = 'small' | 'medium' | 'large'

export interface AppSettings {
	/** Terminal font size preference. */
	fontSize: FontSize
	/** SSH keep-alive interval in seconds. 0 = disabled. */
	keepAliveInterval: number
}

const DEFAULTS: AppSettings = {
	fontSize: 'medium',
	keepAliveInterval: 30,
}

/** Maps the FontSize enum to actual pixel values used in TerminalView. */
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
			const loaded: AppSettings = raw
				? {...DEFAULTS, ...JSON.parse(raw)}
				: DEFAULTS
			set({settings: loaded, loaded: true})
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
