import type {ISSHService, SSHConfig} from '@shelly/shared'

type Callback<T> = (data: T) => void

export class MockSSHService implements ISSHService {
	private _isConnected: boolean = false
	private dataListeners: Callback<string>[] = []
	private errorListeners: Callback<Error>[] = []

	private buffer: string = ''

	isConnected(): boolean {
		return this._isConnected
	}

	async connect(config: SSHConfig): Promise<void> {
		if (this._isConnected) {
			throw new Error('Already connected')
		}

		// Simulate connection delay
		await new Promise(resolve => setTimeout(resolve, 800))

		// Simulate success
		this._isConnected = true
		this.emitData(`Connecting to ${config.user}@${config.host}...\r\n`)
		await new Promise(resolve => setTimeout(resolve, 400))

		// Welcome message
		this.emitData('Welcome to Shelly Mock Shell\r\n')
		this.emitData('PowerShell 7.4.1\r\n')
		this.emitData(`PS C:\\Users\\${config.user}> `)
	}

	async disconnect(): Promise<void> {
		this._isConnected = false
		this.emitData('\r\nDisconnected.\r\n')
	}

	async write(data: string): Promise<void> {
		if (!this._isConnected) {
			this.emitError(new Error('Not connected'))
			return
		}

		// Echo back (simulating terminal echo)
		// In real SSH, the server echoes. In mock, we echo.
		// Wait, xterm usually handles local echo? No, in raw mode server handles it.
		// We will simulate server echo.

		// Handle Enter
		if (data === '\r') {
			this.emitData('\r\n')
			this.processCommand(this.buffer)
			this.buffer = ''
			this.emitData('PS C:\\Users\\MockUser> ')
		}
		// Handle Backspace (Del = \x7f)
		else if (data === '\x7f') {
			if (this.buffer.length > 0) {
				this.buffer = this.buffer.slice(0, -1)
				// Erase sequence: Backspace, Space, Backspace
				this.emitData('\b \b')
			}
		}
		// Handle normal chars
		else {
			this.buffer += data
			this.emitData(data)
		}
	}

	async writeChar(char: string): Promise<void> {
		return this.write(char)
	}

	private processCommand(cmd: string) {
		const trimmed = cmd.trim()
		if (trimmed === 'ls' || trimmed === 'dir') {
			this.emitData('    Directory: C:\\Users\\MockUser\r\n\r\n')
			this.emitData(
				'Mode                 LastWriteTime         Length Name\r\n',
			)
			this.emitData(
				'----                 -------------         ------ ----\r\n',
			)
			this.emitData(
				'd-----        3/22/2026   3:00 PM                Documents\r\n',
			)
			this.emitData(
				'd-----        3/22/2026   3:00 PM                Downloads\r\n',
			)
			this.emitData(
				'-a----        3/22/2026   3:00 PM             24 secret.txt\r\n',
			)
		} else if (trimmed === 'whoami') {
			this.emitData('shelly\\mockuser\r\n')
		} else if (trimmed === 'exit') {
			this.disconnect()
		} else if (trimmed === '') {
			// do nothing
		} else {
			this.emitData(
				`'${trimmed}' is not recognized as a name of a cmdlet, function, script file, or executable program.\r\n`,
			)
		}
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
