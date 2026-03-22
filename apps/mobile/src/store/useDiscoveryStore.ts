import {create} from 'zustand'

export interface DiscoveredHost {
	name: string
	host: string
	port: number
}

interface DiscoveryState {
	hosts: DiscoveredHost[]
	isScanning: boolean
	startScan: () => void
	stopScan: () => void
}

export const useDiscoveryStore = create<DiscoveryState>(set => ({
	hosts: [],
	isScanning: false,

	startScan: () => {
		set({isScanning: true, hosts: []})
		// Mock discovery for Expo Go
		setTimeout(() => {
			set({
				hosts: [
					{name: 'Windows-Desktop', host: '192.168.1.10', port: 22},
					{name: 'Lab-Server', host: '192.168.1.50', port: 22},
				],
				isScanning: false,
			})
		}, 2000)
	},

	stopScan: () => {
		set({isScanning: false})
	},
}))
