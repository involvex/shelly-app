import SSHClient, {PtyType} from '@dylankenneally/react-native-ssh-sftp'
import type {ISSHService, SSHConfig} from '@shelly/shared'

type DataCallback = (data: string) => void
type ErrorCallback = (error: Error) => void

export class SSHService implements ISSHService {
	private client: SSHClient | null = null
	private _isConnected = false
	private dataListeners: DataCallback[] = []
	private errorListeners: ErrorCallback[] = []

	isConnected(): boolean {
		return this._isConnected
	}

	async connect(config: SSHConfig): Promise<void> {
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

			// Register shell output listener before starting the shell
			this.client.on('Shell', (event: {value: string}) => {
				this.emitData(event.value)
			})

			await this.client.startShell(PtyType.XTERM)
			this._isConnected = true
		} catch (err: unknown) {
			this.client = null
			this._isConnected = false
			throw err instanceof Error ? err : new Error(String(err))
		}
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			this.client.closeShell()
			this.client.disconnect()
			this.client = null
		}
		this._isConnected = false
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
