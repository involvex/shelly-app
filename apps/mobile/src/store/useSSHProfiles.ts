import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import type {SSHAuthMode} from '@shelly/shared'
import {create} from 'zustand'

const KEY_PROFILES = 'shelly_ssh_profiles'

export interface SSHProfile {
	id: string
	name: string
	host: string
	port: string
	user: string
	authMode?: SSHAuthMode
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

function secureKeyMaterialForProfile(id: string) {
	return `shelly_profile_key_${id}`
}

function secureKeyPassphraseForProfile(id: string) {
	return `shelly_profile_key_passphrase_${id}`
}

export interface SSHProfileSecrets {
	password: string
	privateKey: string
	keyPassphrase: string
}

interface SSHProfilesState {
	profiles: SSHProfile[]
	loaded: boolean
	load: () => Promise<void>
	add: (
		profile: Omit<SSHProfile, 'id'>,
		secrets: SSHProfileSecrets,
	) => Promise<void>
	update: (
		id: string,
		profile: Omit<SSHProfile, 'id'>,
		secrets?: Partial<SSHProfileSecrets>,
	) => Promise<void>
	remove: (id: string) => Promise<void>
	getSecrets: (id: string) => Promise<SSHProfileSecrets>
}

export const useSSHProfiles = create<SSHProfilesState>((set, get) => ({
	profiles: [],
	loaded: false,

	load: async () => {
		const raw = await AsyncStorage.getItem(KEY_PROFILES).catch(() => null)
		const profiles: SSHProfile[] = raw ? JSON.parse(raw) : []
		set({
			profiles: profiles.map(profile => ({
				authMode: profile.authMode ?? 'password',
				...profile,
			})),
			loaded: true,
		})
	},

	add: async (profile, secrets) => {
		const id = `${Date.now()}`
		const newProfile: SSHProfile = {
			...profile,
			authMode: profile.authMode ?? 'password',
			id,
		}
		const next = [...get().profiles, newProfile]
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		await Promise.all([
			SecureStore.setItemAsync(secureKeyForProfile(id), secrets.password).catch(
				() => null,
			),
			SecureStore.setItemAsync(
				secureKeyMaterialForProfile(id),
				secrets.privateKey,
			).catch(() => null),
			SecureStore.setItemAsync(
				secureKeyPassphraseForProfile(id),
				secrets.keyPassphrase,
			).catch(() => null),
		])
		set({profiles: next})
	},

	update: async (id, profile, secrets) => {
		const next = get().profiles.map(p =>
			p.id === id
				? {...profile, authMode: profile.authMode ?? 'password', id}
				: p,
		)
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		if (secrets !== undefined) {
			await Promise.all([
				secrets.password !== undefined
					? SecureStore.setItemAsync(
							secureKeyForProfile(id),
							secrets.password,
						).catch(() => null)
					: Promise.resolve(),
				secrets.privateKey !== undefined
					? SecureStore.setItemAsync(
							secureKeyMaterialForProfile(id),
							secrets.privateKey,
						).catch(() => null)
					: Promise.resolve(),
				secrets.keyPassphrase !== undefined
					? SecureStore.setItemAsync(
							secureKeyPassphraseForProfile(id),
							secrets.keyPassphrase,
						).catch(() => null)
					: Promise.resolve(),
			])
		}
		set({profiles: next})
	},

	remove: async id => {
		const next = get().profiles.filter(p => p.id !== id)
		await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(next))
		await Promise.all([
			SecureStore.deleteItemAsync(secureKeyForProfile(id)).catch(() => null),
			SecureStore.deleteItemAsync(secureKeyMaterialForProfile(id)).catch(
				() => null,
			),
			SecureStore.deleteItemAsync(secureKeyPassphraseForProfile(id)).catch(
				() => null,
			),
		])
		set({profiles: next})
	},

	getSecrets: async id => {
		const [password, privateKey, keyPassphrase] = await Promise.all([
			SecureStore.getItemAsync(secureKeyForProfile(id)).catch(() => null),
			SecureStore.getItemAsync(secureKeyMaterialForProfile(id)).catch(
				() => null,
			),
			SecureStore.getItemAsync(secureKeyPassphraseForProfile(id)).catch(
				() => null,
			),
		])

		return {
			password: password ?? '',
			privateKey: privateKey ?? '',
			keyPassphrase: keyPassphrase ?? '',
		}
	},
}))
