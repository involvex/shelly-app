import SSHClient, {PtyType} from '@dylankenneally/react-native-ssh-sftp'
import type {ISSHService, SSHConfig} from '@shelly/shared'
import type {TerminalType} from '@/store/useAppSettings'
import {Dimensions, NativeModules} from 'react-native'
import {useAppSettings} from '@/store/useAppSettings'

function terminalTypeToPty(t: TerminalType): PtyType {
	switch (t) {
		case 'vt100':
			return PtyType.VT100
		case 'vt102':
			return PtyType.VT102
		case 'vt220':
			return PtyType.VT220
		case 'ansi':
			return PtyType.ANSI
		case 'vanilla':
			return PtyType.VANILLA
		case 'xterm':
		case 'xterm-256color':
		default:
			return PtyType.XTERM
	}
}

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
			// setup commands correctly — Windows PowerShell can take 1-3s
			// to initialise its profile, modules, and PSReadLine.
			let shellReady = false
			// Accumulate the opening banner so we can detect the shell flavour.
			let bannerBuf = ''
			let bannerLocked = false // stop accumulating after detection
			this.client.on('Shell', (event: {value: string} | string) => {
				const data =
					typeof event === 'string' ? event : (event as {value: string})?.value
				if (data != null && data !== '') {
					shellReady = true
					if (!bannerLocked) {
						bannerBuf += data
						// Lock after 4 kB — we've seen enough to classify the shell
						if (bannerBuf.length > 4096) bannerLocked = true
					}
					this.emitData(data)
				}
			})

			const {terminalType} = useAppSettings.getState().settings
			const ptyType = terminalTypeToPty(terminalType)
			await this.client.startShell(ptyType)

			// Detect the remote shell flavour from the opening banner and send
			// platform-appropriate environment variable setup commands.
			//
			// • Unix/bash:  wrap in stty -echo/echo so the command text is not
			//               echoed back into the terminal output.
			// • Windows CMD: use @SET syntax (@-prefix suppresses CMD's own echo
			//               display) then cls to clear the banner clutter.
			// • PowerShell: use $env: assignment syntax.
			//
			// Falls back to the Unix path if no banner is received within ~5 s.
			const {width, height} = Dimensions.get('window')
			const cols = Math.max(40, Math.floor(width / 8))
			const termRows = Math.max(20, Math.floor(height / 18))
			const termEnv =
				terminalType === 'xterm-256color' ? 'xterm-256color' : terminalType

			/** Classify the remote shell from the accumulated banner. */
			const detectShell = (): 'cmd' | 'powershell' | 'unix' => {
				const b = bannerBuf
				if (/Microsoft Windows/i.test(b)) {
					// Could be CMD or PowerShell running on top of it
					if (/Windows PowerShell|pwsh/i.test(b)) return 'powershell'
					return 'cmd'
				}
				if (/Windows PowerShell|pwsh/i.test(b)) return 'powershell'
				// If the prompt looks like "PS C:\" it's PowerShell even without banner
				if (/PS [A-Z]:\\/i.test(b)) return 'powershell'
				return 'unix'
			}

			const buildSetupCmd = (shell: 'cmd' | 'powershell' | 'unix'): string => {
				const gitEnv = 'GIT_TERMINAL_PROMPT=0'
				const askEnv = 'GIT_ASKPASS=echo'
				const sshAsk = 'SSH_ASKPASS=echo'
				const msys = 'MSYS_NO_PATHCONV=1'

				if (shell === 'cmd') {
					// Each @SET suppresses CMD's own echo for that line.
					// Chained with & so they run as one logical command line.
					// cls at the end clears the banner + echoed setup text.
					return (
						`@SET "${gitEnv}"&` +
						`@SET "${askEnv}"&` +
						`@SET "${sshAsk}"&` +
						`@SET "${msys}"&` +
						`@cls\r`
					)
				}

				if (shell === 'powershell') {
					// Load user profile so scoop/nvm/npm PATH entries are present, then
					// explicitly merge Machine+User PATH so git, npm, npx etc. work
					// without "pwsh -c" wrappers.  ErrorAction SilentlyContinue prevents
					// failures on headless sessions where $PROFILE doesn't exist.
					return (
						`. $PROFILE -ErrorAction SilentlyContinue; ` +
						`$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User'); ` +
						`$env:GIT_TERMINAL_PROMPT='0'; ` +
						`$env:GIT_ASKPASS='echo'; ` +
						`$env:SSH_ASKPASS='echo'; ` +
						`$env:MSYS_NO_PATHCONV='1'; ` +
						`Clear-Host\r`
					)
				}

				// Unix / bash / zsh / sh
				// stty -echo turns off PTY local echo so this command itself is not
				// printed back into the terminal output.  We re-enable it at the end.
				return (
					`stty -echo 2>/dev/null; ` +
					`stty cols ${cols} rows ${termRows} 2>/dev/null; ` +
					`export TERM=${termEnv}; ` +
					`export GIT_TERMINAL_PROMPT=0; ` +
					`export GIT_ASKPASS=echo; ` +
					`export SSH_ASKPASS=echo; ` +
					`export MSYS_NO_PATHCONV=1; ` +
					`unset DISPLAY; ` +
					`stty echo 2>/dev/null\r`
				)
			}

			const attemptSetup = (attempt = 0) => {
				if (attempt >= 10) return // Give up after ~5 s total
				const delay = attempt < 3 ? 500 : 1000
				setTimeout(() => {
					if (!this.client || !this._isConnected) return
					if (shellReady || attempt >= 5) {
						bannerLocked = true // freeze the banner buffer
						const shell = detectShell()
						const setupCmd = buildSetupCmd(shell)
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

	async writeChar(char: string): Promise<void> {
		return this.write(char)
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
