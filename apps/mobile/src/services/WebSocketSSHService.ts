import type {ISSHService, SSHConfig} from '@shelly/shared'

type Callback<T> = (data: T) => void

export interface WebSocketSSHConfig {
	url: string
	protocols?: string[]
}

export class WebSocketSSHService implements ISSHService {
	private _isConnected = false
	private socket: WebSocket | null = null
	private dataListeners: Callback<string>[] = []
	private errorListeners: Callback<Error>[] = []

	isConnected(): boolean {
		return this._isConnected
	}

	async connect(config: SSHConfig): Promise<void> {
		if (this._isConnected) {
			throw new Error('Already connected')
		}

		const wsConfig = config as SSHConfig & WebSocketSSHConfig
		const url =
			wsConfig.url ?? `wss://${wsConfig.host}:${wsConfig.port || 8022}/shell`

		return new Promise<void>((resolve, reject) => {
			try {
				this.socket = new WebSocket(url, wsConfig.protocols)
			} catch (e: unknown) {
				const msg =
					e instanceof Error ? e.message : 'Failed to create WebSocket'
				reject(new Error(msg))
				return
			}

			this.socket.onopen = () => {
				this._isConnected = true
				this.socket?.send(
					JSON.stringify({
						type: 'auth',
						user: config.user,
						auth: config.auth,
					}),
				)
				resolve()
			}

			this.socket.onmessage = (event: MessageEvent) => {
				const data =
					typeof event.data === 'string'
						? event.data
						: new TextDecoder().decode(event.data as ArrayBuffer)
				this.emitData(data)
			}

			this.socket.onerror = (event: Event) => {
				const msg =
					(event as ErrorEvent).message || 'WebSocket connection error'
				this.emitError(new Error(msg))
			}

			this.socket.onclose = () => {
				this._isConnected = false
				this.emitData('\r\nConnection closed.\r\n')
			}

			setTimeout(() => {
				if (!this._isConnected) {
					this.socket?.close()
					reject(new Error('WebSocket connection timed out'))
				}
			}, 10000)
		})
	}

	async disconnect(): Promise<void> {
		if (this.socket) {
			this.socket.close()
			this.socket = null
		}
		this._isConnected = false
	}

	async write(data: string): Promise<void> {
		if (!this._isConnected || !this.socket) {
			this.emitError(new Error('Not connected'))
			return
		}

		this.socket.send(JSON.stringify({type: 'data', payload: data}))
	}

	async writeChar(char: string): Promise<void> {
		return this.write(char)
	}

	onData(callback: Callback<string>): () => void {
		this.dataListeners.push(callback)
		return () => {
			this.dataListeners = this.dataListeners.filter(cb => cb !== callback)
		}
	}

	onError(callback: Callback<Error>): () => void {
		this.errorListeners.push(callback)
		return () => {
			this.errorListeners = this.errorListeners.filter(cb => cb !== callback)
		}
	}

	private emitData(data: string) {
		for (const cb of this.dataListeners) {
			cb(data)
		}
	}

	private emitError(error: Error) {
		for (const cb of this.errorListeners) {
			cb(error)
		}
	}
}
