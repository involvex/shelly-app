import Constants from 'expo-constants'
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
	} catch (err: unknown) {
		console.warn('[Discovery] expo-network unavailable:', err)
		// Native module unavailable — startScan will surface a user-facing error.
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('react-native-tcp-socket')
		// react-native-tcp-socket may export via ESM interop (.default) or CJS
		// (module.exports = TcpSocket). Handle both to avoid a silent undefined.
		const candidate = mod?.default ?? mod
		if (typeof candidate?.createConnection === 'function') {
			TcpSocket = candidate
		} else {
			console.warn(
				'[Discovery] react-native-tcp-socket loaded but createConnection API is missing — native module may not be linked',
			)
		}
	} catch (err: unknown) {
		console.warn('[Discovery] react-native-tcp-socket unavailable:', err)
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
	/** True when native discovery dependencies are available in the current runtime. */
	isAvailable: boolean
	/** Active subnet description shown in diagnostics and scan results. */
	scanSubnet: string | null
	/** Number of addresses probed so far in the current scan. */
	scanProgress: number
	/** Total addresses to probe (set at scan start). */
	scanTotal: number
	/** Set when network info is unavailable or the scan cannot start. */
	scanError: string | null
	startScan: () => void
	stopScan: () => void
}

const BATCH_SIZE = 24
const PROBE_TIMEOUT = 2200
const SSH_PORT = 22

type ScanRange = {
	label: string
	hosts: string[]
}

function unavailableRuntimeMessage(params: {
	platform: string
	isExpoGoRuntime: boolean
	hasNetwork: boolean
	hasTcpSocket: boolean
}): string | null {
	const {platform, isExpoGoRuntime, hasNetwork, hasTcpSocket} = params
	if (platform === 'web') {
		return 'Device scanning is only available on Android and iOS.'
	}
	if (!hasNetwork) {
		return isExpoGoRuntime
			? 'Network scanning is unavailable in Expo Go. Open this app in a development build (not Expo Go) to enable local discovery.'
			: 'Network scanning native module is unavailable. Rebuild and reinstall the development build (expo run:android / expo run:ios).'
	}
	if (!hasTcpSocket) {
		return isExpoGoRuntime
			? 'Port scanning is unavailable in Expo Go. Open this app in a development build (not Expo Go) to enable local discovery.'
			: 'Port scanning native module is unavailable. Rebuild and reinstall the development build after native dependency changes.'
	}
	return null
}

function subnetBase(ip: string): string | null {
	const parts = ip.split('.')
	if (parts.length !== 4) return null
	return `${parts[0]}.${parts[1]}.${parts[2]}`
}

function buildScanRange(ip: string): ScanRange | null {
	const base = subnetBase(ip)
	if (!base) return null

	const hosts: string[] = []
	for (let i = 1; i <= 254; i++) {
		const host = `${base}.${i}`
		if (host !== ip) hosts.push(host)
	}

	return {
		label: `${base}.x`,
		hosts,
	}
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

		const cleanup = () => {
			if (!socket) return
			// Remove all listeners first to prevent callbacks firing on a
			// half-closed socket.  Then defer destroy via setImmediate so
			// any pending native thread-pool operations on this socket ID
			// can finish before the native module removes it from its map.
			// This prevents "No socket with id X" crashes in TcpSocketModule.
			const s = socket
			socket = null
			s.removeAllListeners()
			setImmediate(() => {
				try {
					s.end()
				} catch {
					// already closed
				}
				// Force-destroy after a short delay if end() didn't close it
				setTimeout(() => {
					try {
						s.destroy()
					} catch {
						// already destroyed
					}
				}, 100)
			})
		}

		const timer = setTimeout(() => {
			if (!settled) {
				settled = true
				cleanup()
				resolve(false)
			}
		}, timeoutMs)

		const settle = (open: boolean) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			cleanup()
			resolve(open)
		}

		try {
			socket = tcpSocket.createConnection({host, port}, () => settle(true))
			// 'data' fires when the SSH banner arrives — useful if 'connect' fires late
			socket.on('data', () => settle(true))
			socket.on('error', () => settle(false))
			// Do NOT use socket.setTimeout here: it races with the outer timer and
			// can fire just before the 'connect' event on slow paths, causing the
			// open port to be falsely reported as closed.
		} catch {
			settle(false)
		}
	})
}

export const useDiscoveryStore = create<DiscoveryState>(set => {
	// TS 5.4+ can preserve literal narrowing from last assignment.
	// Wrap reads in Boolean(...) so checks stay typed as plain boolean.
	let ctrl = {aborted: false}
	const runtime = Constants.executionEnvironment
	const isExpoGoRuntime = runtime === 'storeClient'
	const hasNetwork = Boolean(Network)
	const hasTcpSocket = Boolean(TcpSocket)
	const unavailableMessage = unavailableRuntimeMessage({
		platform: Platform.OS,
		isExpoGoRuntime,
		hasNetwork,
		hasTcpSocket,
	})

	return {
		hosts: [],
		isScanning: false,
		isAvailable: unavailableMessage == null,
		scanSubnet: null,
		scanProgress: 0,
		scanTotal: 0,
		scanError: unavailableMessage,

		startScan: async () => {
			// Abort any ongoing scan, then create a fresh controller for this run.
			ctrl.aborted = true
			const localCtrl = {aborted: false}
			ctrl = localCtrl
			set({
				isScanning: true,
				hosts: [],
				scanSubnet: null,
				scanProgress: 0,
				scanTotal: 0,
				scanError: null,
			})

			if (!Network) {
				set({
					isScanning: false,
					scanError: unavailableRuntimeMessage({
						platform: Platform.OS,
						isExpoGoRuntime,
						hasNetwork: false,
						hasTcpSocket,
					}),
				})
				return
			}
			if (!TcpSocket) {
				set({
					isScanning: false,
					scanError: unavailableRuntimeMessage({
						platform: Platform.OS,
						isExpoGoRuntime,
						hasNetwork: true,
						hasTcpSocket: false,
					}),
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

			const range = buildScanRange(deviceIp)
			if (!range) {
				set({
					isScanning: false,
					scanError: 'Unrecognized IP format: ' + deviceIp,
				})
				return
			}

			console.log(
				`[Discovery] Device IP: ${deviceIp} — scanning ${range.label} on port ${SSH_PORT}`,
			)

			set({scanSubnet: range.label, scanTotal: range.hosts.length})

			let scanned = 0
			let totalFound = 0
			for (let i = 0; i < range.hosts.length; i += BATCH_SIZE) {
				if (localCtrl.aborted) break
				const batch = range.hosts.slice(i, i + BATCH_SIZE)
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

				if (found.length > 0) {
					totalFound += found.length
					console.log(
						`[Discovery] Found open port 22 on: ${found.map(h => h.host).join(', ')}`,
					)
				}

				set(state => ({
					scanProgress: scanned,
					hosts: found.length > 0 ? [...state.hosts, ...found] : state.hosts,
				}))
			}

			if (!localCtrl.aborted) {
				console.log(
					`[Discovery] Scan complete — subnet ${range.label}, found: ${totalFound} host(s)`,
				)
				set(state => ({
					isScanning: false,
					scanError:
						state.hosts.length === 0
							? `Scanned ${range.label}, no reachable SSH devices were found on port ${SSH_PORT}.\n` +
								`• This build uses a fallback /24 scan because Expo did not expose the subnet mask\n` +
								`• Check Windows Firewall allows port 22 inbound\n` +
								`• Ensure router AP isolation is off\n` +
								`• Confirm phone & PC are on the same subnet (${range.label})`
							: null,
				}))
			}
		},

		stopScan: () => {
			ctrl.aborted = true
			set({isScanning: false})
		},
	}
})
