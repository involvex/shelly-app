export const SharedConstant = 'Shelly Shared'

export interface SSHConfig {
	host: string
	port: number
	user: string
	auth: {
		type: 'password' | 'key'
		value: string // Password or Private Key content
		keyPassphrase?: string
	}
	keepAliveInterval?: number
}

export interface ISSHService {
	connect(config: SSHConfig): Promise<void>
	disconnect(): Promise<void>
	write(data: string): Promise<void>
	onData(callback: (data: string) => void): () => void // Returns unsubscribe
	onError(callback: (error: Error) => void): () => void
	isConnected(): boolean
}

export type Snippet = {
	id: string
	name: string
	command: string
	category?: string
}
