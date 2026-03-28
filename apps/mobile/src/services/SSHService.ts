import SSHClient, {PtyType} from '@dylankenneally/react-native-ssh-sftp'
import type {ISSHService, SSHConfig} from '@shelly/shared'
import {Dimensions, NativeModules} from 'react-native'

type DataCallback = (data: string) => void
type ErrorCallback = (error: Error) => void

/** Returns true when the SSH native module is linked and available. */
export function isSSHNativeAvailable(): boolean {
	return !!NativeModules.RNSSHClient
}

export class SSHService implements ISSHService {
	private client: SSHClient | null = null
	private _isConnected = false
	private dataListeners: DataCallback[] = []
	private errorListeners: ErrorCallback[] = []

	isConnected(): boolean {
		return this._isConnected
	}

	async connect(config: SSHConfig): Promise<void> {
		if (!NativeModules.RNSSHClient) {
			throw new Error(
				'SSH native module unavailable.\n' +
					'Expo Go does not support custom native modules.\n' +
					'Build a development client: expo run:android',
			)
		}

		if (this._isConnected) {
			throw new Error('Already connected')
		}

		try {
			if (config.auth.type === 'key') {
				this.client = await SSHClient.connectWithKey(
					config.host,
					config.port,
					config.user,
					config.auth.value,
					config.auth.keyPassphrase,
				)
			} else {
				this.client = await SSHClient.connectWithPassword(
					config.host,
					config.port,
					config.user,
					config.auth.value,
				)
			}

			// Register shell output listener before starting the shell.
			// Track when the first data arrives (shell is ready) to time the
			// stty/export commands correctly — Windows PowerShell can take 1-3s
			// to initialise its profile, modules, and PSReadLine.
			let shellReady = false
			this.client.on('Shell', (event: {value: string} | string) => {
				const data =
					typeof event === 'string' ? event : (event as {value: string})?.value
				if (data != null && data !== '') {
					shellReady = true
					this.emitData(data)
				}
			})

			await this.client.startShell(PtyType.XTERM)

			// Set terminal dimensions and environment variables so programs like git,
			// vim, and less work correctly. The SSH library starts a 0×0 PTY; without
			// explicit stty the kernel reports a device error when git tries to open
			// /dev/tty (the "could not read Username / No such device" error).
			//
			// Wait for the shell to produce its first output (indicating it's alive
			// and accepting input) before sending setup commands.  Falls back to
			// forcing the commands after ~5s if the shell never produces output.
			const {width, height} = Dimensions.get('window')
			const cols = Math.max(40, Math.floor(width / 8))
			const rows = Math.max(20, Math.floor(height / 18))
			const setupCmd = `stty cols ${cols} rows ${rows} 2>/dev/null; export TERM=xterm-256color; export GIT_TERMINAL_PROMPT=0\r`

			const attemptSetup = (attempt = 0) => {
				if (attempt >= 10) return // Give up after ~5s total
				const delay = attempt < 3 ? 500 : 1000
				setTimeout(() => {
					if (!this.client || !this._isConnected) return
					if (shellReady || attempt >= 5) {
						void this.client.writeToShell(setupCmd).catch(() => {})
					} else {
						attemptSetup(attempt + 1)
					}
				}, delay)
			}
			attemptSetup()

			this._isConnected = true
		} catch (err: unknown) {
			this.client = null
			this._isConnected = false
			throw err instanceof Error ? err : new Error(String(err))
		}
	}

	async disconnect(): Promise<void> {
		const currentClient = this.client

		// Clear JS-visible connection state first so the app can always return to
		// the connection screen even if the native library errors during teardown.
		this.client = null
		this._isConnected = false

		if (!currentClient) {
			return
		}

		try {
			await Promise.resolve(currentClient.disconnect())
		} catch (err: unknown) {
			this.emitError(
				err instanceof Error
					? err
					: new Error('SSH disconnect failed while closing the session.'),
			)
		}
	}

	async write(data: string): Promise<void> {
		if (!this.client || !this._isConnected) {
			throw new Error('Not connected')
		}
		await this.client.writeToShell(data)
	}

	onData(callback: DataCallback): () => void {
		this.dataListeners.push(callback)
		return () => {
			this.dataListeners = this.dataListeners.filter(cb => cb !== callback)
		}
	}

	onError(callback: ErrorCallback): () => void {
		this.errorListeners.push(callback)
		return () => {
			this.errorListeners = this.errorListeners.filter(cb => cb !== callback)
		}
	}

	private emitData(data: string) {
		this.dataListeners.forEach(cb => cb(data))
	}

	private emitError(error: Error) {
		this.errorListeners.forEach(cb => cb(error))
	}
}
