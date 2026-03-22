import type {ISSHService, SSHConfig} from '@shelly/shared'
import {MockSSHService} from '../services/MockSSHService'
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

export const useSSHStore = create<SSHState>(set => {
	// Use MockSSHService for Expo Go / Phase 1
	const service = new MockSSHService()

	// Setup listeners
	service.onData(data => {
		set(state => ({output: state.output + data}))
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
