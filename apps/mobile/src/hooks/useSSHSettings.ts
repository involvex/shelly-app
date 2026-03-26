import AsyncStorage from '@react-native-async-storage/async-storage'
import {useCallback, useEffect, useState} from 'react'
import * as SecureStore from 'expo-secure-store'
import type {SSHAuthMode} from '@shelly/shared'

const KEY_HOST = 'shelly_last_host'
const KEY_PORT = 'shelly_last_port'
const KEY_USER = 'shelly_last_user'
const KEY_AUTH_MODE = 'shelly_last_auth_mode'
const SECURE_KEY_PASS = 'shelly_last_password'
const SECURE_KEY_PRIVATE_KEY = 'shelly_last_private_key'
const SECURE_KEY_PASSPHRASE = 'shelly_last_key_passphrase'

export interface SSHLastSettings {
	host: string
	port: string
	user: string
	authMode: SSHAuthMode
	password: string
	privateKey: string
	keyPassphrase: string
}

interface UseSSHSettings {
	settings: SSHLastSettings
	updateSetting: <K extends keyof SSHLastSettings>(
		key: K,
		value: SSHLastSettings[K],
	) => void
	save: (values: SSHLastSettings) => Promise<void>
	loaded: boolean
}

export function useSSHSettings(): UseSSHSettings {
	const [loaded, setLoaded] = useState(false)
	const [settings, setSettings] = useState<SSHLastSettings>({
		host: '',
		port: '22',
		user: '',
		authMode: 'password',
		password: '',
		privateKey: '',
		keyPassphrase: '',
	})

	useEffect(() => {
		let cancelled = false
		async function load() {
			const [host, port, user, authMode, password, privateKey, keyPassphrase] =
				await Promise.all([
					AsyncStorage.getItem(KEY_HOST),
					AsyncStorage.getItem(KEY_PORT),
					AsyncStorage.getItem(KEY_USER),
					AsyncStorage.getItem(KEY_AUTH_MODE),
					SecureStore.getItemAsync(SECURE_KEY_PASS).catch(() => null),
					SecureStore.getItemAsync(SECURE_KEY_PRIVATE_KEY).catch(() => null),
					SecureStore.getItemAsync(SECURE_KEY_PASSPHRASE).catch(() => null),
				])
			if (!cancelled) {
				setSettings({
					host: host ?? '',
					port: port ?? '22',
					user: user ?? '',
					authMode: authMode === 'key' ? 'key' : 'password',
					password: password ?? '',
					privateKey: privateKey ?? '',
					keyPassphrase: keyPassphrase ?? '',
				})
				setLoaded(true)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	const updateSetting = useCallback(
		<K extends keyof SSHLastSettings>(key: K, value: SSHLastSettings[K]) => {
			setSettings(prev => ({...prev, [key]: value}))
		},
		[],
	)

	const save = useCallback(async (values: SSHLastSettings) => {
		await Promise.all([
			AsyncStorage.setItem(KEY_HOST, values.host),
			AsyncStorage.setItem(KEY_PORT, values.port),
			AsyncStorage.setItem(KEY_USER, values.user),
			AsyncStorage.setItem(KEY_AUTH_MODE, values.authMode),
			SecureStore.setItemAsync(SECURE_KEY_PASS, values.password).catch(
				() => null,
			),
			SecureStore.setItemAsync(SECURE_KEY_PRIVATE_KEY, values.privateKey).catch(
				() => null,
			),
			SecureStore.setItemAsync(
				SECURE_KEY_PASSPHRASE,
				values.keyPassphrase,
			).catch(() => null),
		])
	}, [])

	return {settings, updateSetting, save, loaded}
}
