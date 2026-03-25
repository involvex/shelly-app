import {Platform} from 'react-native'
import {create} from 'zustand'

// Both expo-network and react-native-tcp-socket are native-only modules. A static
// top-level import throws synchronously when the native bridge can't find the module
// (e.g. running before a clean prebuild, on web, or in Expo Go). Use try-catch
// require() so the store module always initializes successfully.
let Network: typeof import('expo-network') | null = null
let TcpSocket: (typeof import('react-native-tcp-socket'))['default'] | null =
	null

if (Platform.OS !== 'web') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		Network = require('expo-network')
	} catch {
		// Native module unavailable — startScan will surface a user-facing error.
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		TcpSocket = require('react-native-tcp-socket').default
	} catch {
		// Native module unavailable — probePort will resolve false for every host.
	}
}

export interface DiscoveredHost {
	name: string
	host: string
	port: number
}

interface DiscoveryState {
	hosts: DiscoveredHost[]
	isScanning: boolean
	/** Number of addresses probed so far in the current scan. */
	scanProgress: number
	/** Total addresses to probe (set at scan start). */
	scanTotal: number
	/** Set when network info is unavailable or the scan cannot start. */
	scanError: string | null
	startScan: () => void
	stopScan: () => void
}

const BATCH_SIZE = 30
const PROBE_TIMEOUT = 800
const SSH_PORT = 22

function subnetBase(ip: string): string | null {
	const parts = ip.split('.')
	if (parts.length !== 4) return null
	return `${parts[0]}.${parts[1]}.${parts[2]}`
}

function probePort(
	host: string,
	port: number,
	timeoutMs: number,
): Promise<boolean> {
	if (!TcpSocket) return Promise.resolve(false)
	const tcpSocket = TcpSocket

	return new Promise(resolve => {
		let settled = false
		let socket: ReturnType<typeof tcpSocket.createConnection> | null = null

		const timer = setTimeout(() => {
			if (!settled) {
				settled = true
				try {
					socket?.destroy()
				} catch {
					// already destroyed
				}
				resolve(false)
			}
		}, timeoutMs)

		const settle = (open: boolean) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			try {
				socket?.destroy()
			} catch {
				// already destroyed
			}
			resolve(open)
		}

		try {
			socket = tcpSocket.createConnection({host, port}, () => settle(true))
			socket.on('error', () => settle(false))
			socket.on('timeout', () => settle(false))
			socket.setTimeout(timeoutMs)
		} catch {
			settle(false)
		}
	})
}

export const useDiscoveryStore = create<DiscoveryState>(set => {
	// TS 5.4+ can preserve literal narrowing from last assignment.
	// Wrap reads in Boolean(...) so checks stay typed as plain boolean.
	const ctrl = {aborted: false}

	return {
		hosts: [],
		isScanning: false,
		scanProgress: 0,
		scanTotal: 0,
		scanError: null,

		startScan: async () => {
			ctrl.aborted = false
			set({
				isScanning: true,
				hosts: [],
				scanProgress: 0,
				scanTotal: 0,
				scanError: null,
			})

			if (!Network) {
				set({
					isScanning: false,
					scanError:
						Platform.OS === 'web'
							? 'Device scanning is only available on Android and iOS.'
							: 'Network scanning is unavailable. Rebuild the app with expo prebuild to enable this feature.',
				})
				return
			}
			// Capture in a const so TypeScript keeps the non-null narrowing across awaits.
			const network = Network

			let deviceIp: string
			try {
				deviceIp = await network.getIpAddressAsync()
			} catch {
				set({
					isScanning: false,
					scanError:
						'Could not read network info. Grant network permission and try again.',
				})
				return
			}

			if (!deviceIp || deviceIp === '0.0.0.0' || deviceIp.startsWith('127.')) {
				set({
					isScanning: false,
					scanError:
						'No Wi-Fi detected. Connect to Wi-Fi to discover local SSH devices.',
				})
				return
			}

			const base = subnetBase(deviceIp)
			if (!base) {
				set({
					isScanning: false,
					scanError: 'Unrecognized IP format: ' + deviceIp,
				})
				return
			}

			const candidates: string[] = []
			for (let i = 1; i <= 254; i++) {
				const ip = `${base}.${i}`
				if (ip !== deviceIp) candidates.push(ip)
			}
			set({scanTotal: candidates.length})

			let scanned = 0
			for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
				if (ctrl.aborted) break
				const batch = candidates.slice(i, i + BATCH_SIZE)
				const results = await Promise.all(
					batch.map(async host => ({
						host,
						open: await probePort(host, SSH_PORT, PROBE_TIMEOUT),
					})),
				)
				scanned += batch.length
				const found = results
					.filter(r => r.open)
					.map(r => ({name: r.host, host: r.host, port: SSH_PORT}))

				set(state => ({
					scanProgress: scanned,
					hosts: found.length > 0 ? [...state.hosts, ...found] : state.hosts,
				}))
			}

			if (!ctrl.aborted) {
				set({isScanning: false})
			}
		},

		stopScan: () => {
			ctrl.aborted = true
			set({isScanning: false})
		},
	}
})
