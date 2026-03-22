import {SSHService, isSSHNativeAvailable} from '../services/SSHService'
import type {ISSHService, SSHConfig} from '@shelly/shared'
import {MockSSHService} from '../services/MockSSHService'
import {Platform} from 'react-native'
import {create} from 'zustand'

interface SSHState {
	service: ISSHService
	output: string
	isConnecting: boolean
	error: string | null

	// Actions
	connect: (config: SSHConfig) => Promise<void>
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

export const useSSHStore = create<SSHState>(set => {
	const service = createService()

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
		error: null,

		connect: async (config: SSHConfig) => {
			set({isConnecting: true, error: null, output: ''})
			try {
				await service.connect(config)
				set({isConnecting: false})
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : 'Unknown error'
				set({isConnecting: false, error: message})
			}
		},

		disconnect: async () => {
			await service.disconnect()
		},

		sendData: async (data: string) => {
			await service.write(data)
		},

		clearOutput: () => set({output: ''}),
	}
})
