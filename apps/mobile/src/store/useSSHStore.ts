import {SSHService, isSSHNativeAvailable} from '../services/SSHService'
import {WebSocketSSHService} from '../services/WebSocketSSHService'
import type {ISSHService, SSHConfig} from '@shelly/shared'
import {MockSSHService} from '../services/MockSSHService'
import {Platform} from 'react-native'
import {create} from 'zustand'

interface SSHState {
	service: ISSHService
	output: string
	isConnecting: boolean
	isConnected: boolean
	error: string | null
	connectionMode: 'ssh' | 'websocket'

	// Actions
	connect: (config: SSHConfig, mode?: 'ssh' | 'websocket') => Promise<void>
	disconnect: () => Promise<void>
	sendData: (data: string) => Promise<void>
	clearOutput: () => void
}

function createService(): ISSHService {
	// Use real SSH service only when the native module is linked (dev/release build).
	// Falls back to mock in Expo Go (native module not available) and on web.
	if (Platform.OS !== 'web' && isSSHNativeAvailable()) {
		return new SSHService()
	}
	return new MockSSHService()
}

export const useSSHStore = create<SSHState>((set, get) => {
	let service: ISSHService = createService()

	// Setup listeners — guard against null/undefined from the native layer
	service.onData(data => {
		if (data != null && data !== '') {
			set(state => ({output: state.output + data}))
		}
	})

	service.onError(err => {
		set({error: err.message, isConnecting: false})
	})

	return {
		service,
		output: '',
		isConnecting: false,
		isConnected: false,
		error: null,
		connectionMode: 'ssh',

		connect: async (config: SSHConfig, mode?: 'ssh' | 'websocket') => {
			const effectiveMode = mode ?? 'ssh'

			// Switch service if mode changed
			if (effectiveMode !== get().connectionMode) {
				if (get().isConnected) {
					await service.disconnect()
				}
				service =
					effectiveMode === 'websocket'
						? new WebSocketSSHService()
						: createService()

				service.onData(data => {
					if (data != null && data !== '') {
						set(state => ({output: state.output + data}))
					}
				})
				service.onError(err => {
					set({error: err.message, isConnecting: false})
				})

				set({service, connectionMode: effectiveMode})
			}

			set({isConnecting: true, isConnected: false, error: null, output: ''})
			try {
				await service.connect(config)
				set({isConnecting: false, isConnected: true})
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : 'Unknown error'
				set({isConnecting: false, isConnected: false, error: message})
			}
		},

		disconnect: async () => {
			await service.disconnect()
			set({isConnecting: false, isConnected: false, error: null})
		},

		sendData: async (data: string) => {
			await service.write(data)
		},

		clearOutput: () => set({output: ''}),
	}
})
