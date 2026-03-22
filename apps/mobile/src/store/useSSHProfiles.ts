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
}

function secureKeyForProfile(id: string) {
	return `shelly_profile_pw_${id}`
}

interface SSHProfilesState {
	profiles: SSHProfile[]
	loaded: boolean
	load: () => Promise<void>
	add: (profile: Omit<SSHProfile, 'id'>, password: string) => Promise<void>
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
