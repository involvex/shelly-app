import AsyncStorage from '@react-native-async-storage/async-storage'
import {useCallback, useEffect, useState} from 'react'
import * as SecureStore from 'expo-secure-store'

const KEY_HOST = 'shelly_last_host'
const KEY_PORT = 'shelly_last_port'
const KEY_USER = 'shelly_last_user'
const SECURE_KEY_PASS = 'shelly_last_password'

export interface SSHLastSettings {
	host: string
	port: string
	user: string
	password: string
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
		password: '',
	})

	useEffect(() => {
		let cancelled = false
		async function load() {
			const [host, port, user, password] = await Promise.all([
				AsyncStorage.getItem(KEY_HOST),
				AsyncStorage.getItem(KEY_PORT),
				AsyncStorage.getItem(KEY_USER),
				SecureStore.getItemAsync(SECURE_KEY_PASS).catch(() => null),
			])
			if (!cancelled) {
				setSettings({
					host: host ?? '',
					port: port ?? '22',
					user: user ?? '',
					password: password ?? '',
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
			SecureStore.setItemAsync(SECURE_KEY_PASS, values.password).catch(
				() => null,
			),
		])
	}, [])

	return {settings, updateSetting, save, loaded}
}
