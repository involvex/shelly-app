import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import {create} from 'zustand'

const KEY_PROFILES = 'shelly_ssh_profiles'

export interface SSHProfile {
	id: string
	name: string
	host: string
	port: string
	user: string
	/** Optional freeform notes shown below the profile name. */
	description?: string
	/** TERM environment value sent to the SSH server. Defaults to 'xterm-256color'. */
	terminalType?: 'xterm-256color' | 'xterm' | 'vt100'
	/** Shell command executed once the session becomes ready. */
	startupCommand?: string
	/** Hex accent colour for the profile card (one of PROFILE_COLORS). */
	color?: string
}

function secureKeyForProfile(id: string) {
	return `shelly_profile_pw_${id}`
}

interface SSHProfilesState {
	profiles: SSHProfile[]
	loaded: boolean
	load: () => Promise<void>
	add: (profile: Omit<SSHProfile, 'id'>, password: string) => Promise<void>
	update: (
		id: string,
		profile: Omit<SSHProfile, 'id'>,
		password?: string,
	) => Promise<void>
	remove: (id: string) => Promise<void>
	getPassword: (id: string) => Promise<string>
}

export const useSSHProfiles = create<SSHProfilesState>((set, get) => ({
	profiles: [],
	loaded: false,

	load: async () => {
		const raw = await AsyncStorage.getItem(KEY_PROFILES).catch(() => null)
		const profiles: SSHProfile[] = raw ? JSON.parse(raw) : []
		set({profiles, loaded: true})
	},

	add: async (profile, password) => {
		const id = `${Date.now()}`
		const newProfile: SSHProfile = {...profile, id}
		const next = [...get().profiles, newProfile]
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		await SecureStore.setItemAsync(secureKeyForProfile(id), password).catch(
			() => null,
		)
		set({profiles: next})
	},

	update: async (id, profile, password) => {
		const next = get().profiles.map(p => (p.id === id ? {...profile, id} : p))
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		if (password !== undefined) {
			await SecureStore.setItemAsync(secureKeyForProfile(id), password).catch(
				() => null,
			)
		}
		set({profiles: next})
	},

	remove: async id => {
		const next = get().profiles.filter(p => p.id !== id)
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		await SecureStore.deleteItemAsync(secureKeyForProfile(id)).catch(() => null)
		set({profiles: next})
	},

	getPassword: async id => {
		const pw = await SecureStore.getItemAsync(secureKeyForProfile(id)).catch(
			() => null,
		)
		return pw ?? ''
	},
}))
