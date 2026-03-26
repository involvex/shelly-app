export const SharedConstant = 'Shelly Shared'

export type SSHAuthMode = 'password' | 'key'

export interface SSHPasswordAuth {
	type: 'password'
	value: string
}

export interface SSHKeyAuth {
	type: 'key'
	value: string
	keyPassphrase?: string
}

export type SSHAuthConfig = SSHPasswordAuth | SSHKeyAuth

export interface SSHConfig {
	host: string
	port: number
	user: string
	auth: SSHAuthConfig
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
