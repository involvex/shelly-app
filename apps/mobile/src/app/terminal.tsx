import {
	Alert,
	Keyboard,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import type {SSHProfile, SSHProfileSecrets} from '../store/useSSHProfiles'
import {SnippetManagerModal} from '../components/SnippetManagerModal'
import {TERMINAL_THEMES, TERMINAL_COLORS} from '../theme/terminal'
import {ProfileFormModal} from '../components/ProfileFormModal'
import {TerminalToolbar} from '../components/TerminalToolbar'
import {useDiscoveryStore} from '../store/useDiscoveryStore'
import type {IProgressState} from '@xterm/addon-progress'
import {useSnippetStore} from '../store/useSnippetStore'
import {TerminalView} from '../components/TerminalView'
import {useSSHProfiles} from '../store/useSSHProfiles'
import {useAppSettings} from '../store/useAppSettings'
import {useSSHSettings} from '../hooks/useSSHSettings'
import {useColorScheme} from '../lib/useColorScheme'
import {useEffect, useRef, useState} from 'react'
import {useSSHStore} from '../store/useSSHStore'
import type {SSHConfig} from '@shelly/shared'
import {scaleText} from 'react-native-text'
import {StatusBar} from 'expo-status-bar'
import {router} from 'expo-router'

const ts = scaleText({fontSize: 14})

type ConnectionMode = 'ssh' | 'websocket'

export default function TerminalScreen() {
	const {
		output,
		isConnecting,
		isConnected,
		error,
		connect,
		sendData,
		disconnect,
	} = useSSHStore()
	const {loadSnippets} = useSnippetStore()
	const {
		hosts,
		isScanning,
		isAvailable: isDiscoveryAvailable,
		scanSubnet,
		scanProgress,
		scanTotal,
		scanError,
		startScan,
	} = useDiscoveryStore()
	const {settings, updateSetting, save, loaded} = useSSHSettings()
	const {
		profiles,
		loaded: profilesLoaded,
		load: loadProfiles,
		add: addProfile,
		update: updateProfile,
		remove: removeProfile,
		getSecrets,
	} = useSSHProfiles()

	const {colors, colorScheme} = useColorScheme()

	const {settings: appSettings} = useAppSettings()
	const terminalColors =
		TERMINAL_THEMES[appSettings.terminalTheme]?.colors ?? TERMINAL_COLORS

	const [isSnippetsVisible, setSnippetsVisible] = useState(false)
	const [profileFormVisible, setProfileFormVisible] = useState(false)
	const [editingProfile, setEditingProfile] = useState<SSHProfile | undefined>()
	const [editingSecrets, setEditingSecrets] = useState<SSHProfileSecrets>({
		password: '',
		privateKey: '',
		keyPassphrase: '',
	})
	const [connectionMode, setConnectionMode] = useState<ConnectionMode>('ssh')
	const [progressState, setProgressState] = useState<IProgressState | null>(
		null,
	)
	const [wsUrl, setWsUrl] = useState('wss://localhost:8022/shell')

	/**
	 * After connecting, we send this startup command (if any) once with a short
	 * delay to let the remote shell initialize first.
	 */
	const startupCommandRef = useRef<string | null>(null)
	const prevConnectedRef = useRef(false)

	// Trigger startup command when connection becomes active.
	useEffect(() => {
		if (isConnected && !prevConnectedRef.current) {
			const cmd = startupCommandRef.current
			if (cmd?.trim()) {
				setTimeout(() => sendData(cmd.trim() + '\r'), 500)
			}
			startupCommandRef.current = null
		}
		prevConnectedRef.current = isConnected
	}, [isConnected, sendData])

	useEffect(() => {
		loadSnippets()
		startScan()
		loadProfiles()
	}, [])

	// ─── Keyboard height tracking ──────────────────────────────────────────────
	// Directly listening to Keyboard events is more reliable than
	// KeyboardAvoidingView, especially on Android where behavior='height'
	// can fail when the parent layout uses flex sizing.
	// On iOS, keyboardWillShow fires before the animation, giving a smooth lift.
	// The reported height already includes the home-indicator safe area, so we
	// only apply the raw safe-area bottom when the keyboard is hidden.
	const {bottom: safeAreaBottom} = useSafeAreaInsets()
	const [keyboardHeight, setKeyboardHeight] = useState(0)

	useEffect(() => {
		const showEvent =
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
		const hideEvent =
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
		const onShow = (e: {endCoordinates: {height: number}}) =>
			setKeyboardHeight(e.endCoordinates.height)
		const onHide = () => setKeyboardHeight(0)
		const sub1 = Keyboard.addListener(showEvent, onShow)
		const sub2 = Keyboard.addListener(hideEvent, onHide)
		return () => {
			sub1.remove()
			sub2.remove()
		}
	}, [])

	// When the keyboard is visible its height already covers the home indicator,
	// so we can switch cleanly between the two values.
	const bottomPadding = keyboardHeight > 0 ? keyboardHeight : safeAreaBottom

	// ─── Handlers ──────────────────────────────────────────────────────────────

	const handleConnect = async () => {
		const port = parseInt(settings.port, 10) || 22
		await save(settings)
		connect(
			{
				host: settings.host,
				port,
				user: settings.user,
				auth:
					settings.authMode === 'key'
						? {
								type: 'key',
								value: settings.privateKey,
								keyPassphrase: settings.keyPassphrase || undefined,
							}
						: {type: 'password', value: settings.password},
				...(connectionMode === 'websocket' ? {url: wsUrl} : {}),
			} as SSHConfig & {url?: string},
			connectionMode,
		)
	}

	const handleSelectProfile = async (id: string) => {
		const p = profiles.find(x => x.id === id)
		if (!p) return
		const secrets = await getSecrets(id)
		updateSetting('host', p.host)
		updateSetting('port', p.port)
		updateSetting('user', p.user)
		updateSetting('authMode', p.authMode ?? 'password')
		updateSetting('password', secrets.password)
		updateSetting('privateKey', secrets.privateKey)
		updateSetting('keyPassphrase', secrets.keyPassphrase)
		// Stash the startup command to send after connecting.
		startupCommandRef.current = p.startupCommand ?? null
	}

	const handleOpenAddProfile = () => {
		setEditingProfile(undefined)
		setEditingSecrets({password: '', privateKey: '', keyPassphrase: ''})
		setProfileFormVisible(true)
	}

	const handleOpenEditProfile = async (profile: SSHProfile) => {
		const secrets = await getSecrets(profile.id)
		setEditingProfile(profile)
		setEditingSecrets(secrets)
		setProfileFormVisible(true)
	}

	const handleSaveProfile = async (
		profile: Omit<SSHProfile, 'id'>,
		secrets: SSHProfileSecrets,
	) => {
		if (editingProfile) {
			await updateProfile(editingProfile.id, profile, secrets)
		} else {
			await addProfile(profile, secrets)
		}
	}

	const handleDeleteProfile = (id: string, name: string) => {
		Alert.alert('Delete profile', `Remove "${name}"?`, [
			{text: 'Cancel', style: 'cancel'},
			{text: 'Delete', style: 'destructive', onPress: () => removeProfile(id)},
		])
	}

	const handleSnippetSelect = (command: string) => {
		// Append CR so the command runs immediately in the terminal.
		sendData(command + '\r')
	}

	// ─── Connection screen ─────────────────────────────────────────────────────

	if (!isConnected) {
		return (
			<SafeAreaView
				style={[styles.screen, {backgroundColor: colors.background}]}
			>
				<StatusBar
					style={
						Platform.OS === 'ios'
							? 'light'
							: colorScheme === 'dark'
								? 'light'
								: 'dark'
					}
				/>

				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					{/* ── App Header ── */}
					<View style={styles.appHeader}>
						<View style={styles.appHeaderRow}>
							<Text style={styles.appIcon}>🐚</Text>
							<View style={styles.appHeaderText}>
								<Text style={[ts, styles.appTitle]}>Shelly</Text>
								<Text style={[ts, styles.appSubtitle]}>SSH Client</Text>
							</View>
						</View>
						<TouchableOpacity
							onPress={() => router.push('/settings')}
							style={styles.settingsBtn}
							accessibilityRole="button"
							accessibilityLabel="Open settings"
						>
							<MaterialCommunityIcons
								name="cog-outline"
								size={22}
								color="#a1a1aa"
							/>
						</TouchableOpacity>
					</View>

					{/* ── Saved profiles ── */}
					{profilesLoaded && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text style={[ts, styles.sectionLabel]}>Saved Profiles</Text>
								<TouchableOpacity
									onPress={handleOpenAddProfile}
									style={styles.addProfileBtn}
									accessibilityRole="button"
									accessibilityLabel="Add new profile"
								>
									<MaterialCommunityIcons
										name="plus"
										size={16}
										color="#6366f1"
									/>
									<Text style={[ts, styles.addProfileLabel]}>New</Text>
								</TouchableOpacity>
							</View>

							{profiles.length === 0 ? (
								<Text style={[ts, styles.noProfilesHint]}>
									No profiles yet — tap "New" to save a connection
								</Text>
							) : (
								profiles.map(p => (
									<View
										key={p.id}
										style={[
											styles.profileCard,
											{
												// Colored left border using the profile's accent color.
												borderLeftColor: p.color ?? '#6366f1',
												backgroundColor: colors.card,
												borderColor: colors.border,
											},
										]}
									>
										{/* Main tap area — loads the profile into the form */}
										<TouchableOpacity
											style={styles.profileCardInfo}
											onPress={() => handleSelectProfile(p.id)}
											accessibilityRole="button"
											accessibilityLabel={`Use profile ${p.name}`}
										>
											<Text style={[ts, styles.profileName]}>{p.name}</Text>
											{p.description != null && p.description !== '' && (
												<Text style={[ts, styles.profileDesc]}>
													{p.description}
												</Text>
											)}
											<Text style={[ts, styles.profileHost]}>
												{p.user}@{p.host}:{p.port}
											</Text>
										</TouchableOpacity>

										{/* Edit + Delete actions */}
										<View style={styles.profileCardActions}>
											<TouchableOpacity
												onPress={() => handleOpenEditProfile(p)}
												style={styles.profileActionBtn}
												hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}
												accessibilityRole="button"
												accessibilityLabel={`Edit profile ${p.name}`}
											>
												<MaterialCommunityIcons
													name="pencil-outline"
													size={17}
													color="#6b7280"
												/>
											</TouchableOpacity>
											<TouchableOpacity
												onPress={() => handleDeleteProfile(p.id, p.name)}
												style={styles.profileActionBtn}
												hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}
												accessibilityRole="button"
												accessibilityLabel={`Delete profile ${p.name}`}
											>
												<MaterialCommunityIcons
													name="delete-outline"
													size={17}
													color="#6b7280"
												/>
											</TouchableOpacity>
										</View>
									</View>
								))
							)}
						</View>
					)}

					{/* ── Quick-connect form ── */}
					<View style={styles.section}>
						<Text style={[ts, styles.sectionLabel]}>Quick Connect</Text>

						{/* Host + Port */}
						<View style={styles.formRow}>
							<View style={styles.formFieldFlex}>
								<Text style={[ts, styles.fieldLabel]}>Host</Text>
								<TextInput
									value={settings.host}
									onChangeText={v => updateSetting('host', v)}
									placeholder="192.168.1.100"
									placeholderTextColor="#555"
									autoCapitalize="none"
									autoCorrect={false}
									style={[ts, styles.input]}
									accessibilityLabel="SSH host"
								/>
							</View>
							<View style={styles.formFieldPort}>
								<Text style={[ts, styles.fieldLabel]}>Port</Text>
								<TextInput
									value={settings.port}
									onChangeText={v => updateSetting('port', v)}
									placeholder="22"
									placeholderTextColor="#555"
									keyboardType="number-pad"
									style={[ts, styles.input]}
									accessibilityLabel="SSH port"
								/>
							</View>
						</View>

						<Text style={[ts, styles.fieldLabel]}>Username</Text>
						<TextInput
							value={settings.user}
							onChangeText={v => updateSetting('user', v)}
							placeholder="Administrator"
							placeholderTextColor="#555"
							autoCapitalize="none"
							autoCorrect={false}
							style={[ts, styles.input]}
							accessibilityLabel="SSH username"
						/>

						<Text style={[ts, styles.fieldLabel]}>Connection</Text>
						<View style={styles.authModeRow}>
							{(['ssh', 'websocket'] as const).map(mode => (
								<TouchableOpacity
									key={mode}
									onPress={() => setConnectionMode(mode)}
									style={[
										styles.authModeChip,
										connectionMode === mode && styles.authModeChipActive,
									]}
									accessibilityRole="button"
									accessibilityLabel={`Use ${mode === 'ssh' ? 'SSH' : 'WebSocket'} connection`}
								>
									<Text
										style={[
											ts,
											styles.authModeChipLabel,
											connectionMode === mode && styles.authModeChipLabelActive,
										]}
									>
										{mode === 'ssh' ? 'SSH' : 'WebSocket'}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{connectionMode === 'websocket' && (
							<>
								<Text style={[ts, styles.fieldLabel]}>WebSocket URL</Text>
								<TextInput
									value={wsUrl}
									onChangeText={setWsUrl}
									placeholder="wss://host:port/shell"
									placeholderTextColor="#555"
									autoCapitalize="none"
									autoCorrect={false}
									style={[ts, styles.input]}
									accessibilityLabel="WebSocket URL"
								/>
							</>
						)}

						<Text style={[ts, styles.fieldLabel]}>Authentication</Text>
						<View style={styles.authModeRow}>
							{(['password', 'key'] as const).map(mode => (
								<TouchableOpacity
									key={mode}
									onPress={() => updateSetting('authMode', mode)}
									style={[
										styles.authModeChip,
										settings.authMode === mode && styles.authModeChipActive,
									]}
									accessibilityRole="button"
									accessibilityLabel={`Use ${mode === 'password' ? 'password' : 'SSH key'} authentication`}
								>
									<Text
										style={[
											ts,
											styles.authModeChipLabel,
											settings.authMode === mode &&
												styles.authModeChipLabelActive,
										]}
									>
										{mode === 'password' ? 'Password' : 'SSH Key'}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{settings.authMode === 'key' ? (
							<>
								<Text style={[ts, styles.authHint]}>
									Paste an existing OpenSSH private key. Generation and provider
									sync will be added later.
								</Text>
								<Text style={[ts, styles.fieldLabel]}>Private Key</Text>
								<TextInput
									value={settings.privateKey}
									onChangeText={v => updateSetting('privateKey', v)}
									secureTextEntry
									multiline
									placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
									placeholderTextColor="#555"
									style={[ts, styles.input, styles.keyInput]}
									accessibilityLabel="SSH private key"
								/>

								<Text style={[ts, styles.fieldLabel]}>Key Passphrase</Text>
								<TextInput
									value={settings.keyPassphrase}
									onChangeText={v => updateSetting('keyPassphrase', v)}
									secureTextEntry
									placeholder="Optional passphrase"
									placeholderTextColor="#555"
									style={[ts, styles.input]}
									accessibilityLabel="SSH key passphrase"
								/>
							</>
						) : (
							<>
								<Text style={[ts, styles.fieldLabel]}>Password</Text>
								<TextInput
									value={settings.password}
									onChangeText={v => updateSetting('password', v)}
									secureTextEntry
									placeholder="••••••••"
									placeholderTextColor="#555"
									style={[ts, styles.input]}
									accessibilityLabel="SSH password"
								/>
							</>
						)}

						{error != null && error !== '' && (
							<Text style={[ts, styles.errorText]}>{error}</Text>
						)}

						<TouchableOpacity
							onPress={handleConnect}
							disabled={isConnecting || !loaded}
							style={[
								styles.connectBtn,
								(isConnecting || !loaded) && styles.connectBtnDisabled,
							]}
							accessibilityRole="button"
							accessibilityLabel={isConnecting ? 'Connecting' : 'Connect'}
						>
							<MaterialCommunityIcons
								name={isConnecting ? 'loading' : 'ssh'}
								size={18}
								color="#fff"
							/>
							<Text style={[ts, styles.connectBtnLabel]}>
								{isConnecting ? 'Connecting…' : 'Connect'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleOpenAddProfile}
							style={styles.saveProfileBtn}
							accessibilityRole="button"
						>
							<MaterialCommunityIcons
								name="content-save-outline"
								size={15}
								color="#71717a"
							/>
							<Text style={[ts, styles.saveProfileLabel]}>Save as Profile</Text>
						</TouchableOpacity>
					</View>

					{/* ── Local Discovery ── */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={[ts, styles.sectionLabel]}>Local Devices</Text>
							{isScanning ? (
								<Text style={[ts, styles.scanningLabel]}>
									Scanning{scanSubnet ? ` ${scanSubnet}` : ''}…
									{scanTotal > 0 ? ` (${scanProgress}/${scanTotal})` : ''}
								</Text>
							) : (
								<TouchableOpacity
									onPress={() => startScan()}
									disabled={!isDiscoveryAvailable}
									style={styles.rescanBtn}
									accessibilityRole="button"
									accessibilityLabel="Rescan for devices"
								>
									<MaterialCommunityIcons
										name="refresh"
										size={14}
										color="#6366f1"
									/>
									<Text style={[ts, styles.rescanLabel]}>Rescan</Text>
								</TouchableOpacity>
							)}
						</View>
						{hosts.map(d => (
							<TouchableOpacity
								key={d.host}
								onPress={() => updateSetting('host', d.host)}
								style={styles.discoveredHost}
								accessibilityRole="button"
								accessibilityLabel={`Use host ${d.host}`}
							>
								<Text style={[ts, styles.discoveredName]}>{d.name}</Text>
								<Text style={[ts, styles.discoveredAddr]}>{d.host}</Text>
							</TouchableOpacity>
						))}
						{!isScanning && scanError != null && (
							<Text
								style={[
									ts,
									scanError.includes('no reachable SSH devices')
										? styles.scanInfoText
										: styles.scanErrorText,
								]}
							>
								{scanError}
							</Text>
						)}
						{!isScanning && hosts.length === 0 && scanError == null && (
							<Text style={[ts, styles.noDevicesText]}>
								No reachable SSH devices found
								{scanSubnet ? ` on ${scanSubnet}` : ' on this network'}.
							</Text>
						)}
					</View>
				</ScrollView>

				{/* Profile form modal */}
				<ProfileFormModal
					visible={profileFormVisible}
					onClose={() => setProfileFormVisible(false)}
					onSave={handleSaveProfile}
					initialProfile={editingProfile}
					initialSecrets={editingSecrets}
				/>
			</SafeAreaView>
		)
	}

	// ─── Connected (terminal) screen ───────────────────────────────────────────
	//
	// Layout:
	//   SafeAreaView (top/left/right insets only)
	//   └─ View with paddingBottom = keyboard height (or safe-area bottom when hidden)
	//      ├─ terminalHeader  (session info + disconnect button)
	//      ├─ terminalBody    (TerminalView: output + command input)
	//      └─ TerminalToolbar (special-key row — lifts above keyboard via paddingBottom)
	//
	// KeyboardAvoidingView is replaced by direct Keyboard event listeners because
	// behavior='height' is unreliable on Android when the parent uses flex sizing,
	// and the Modal-based snippet modal only works because Modal gets auto-resize.

	return (
		<SafeAreaView
			style={styles.terminalScreen}
			edges={['top', 'left', 'right']}
		>
			{/* bottomPadding tracks keyboard height directly, lifts toolbar + input. */}
			<View style={[styles.kavFlex, {paddingBottom: bottomPadding}]}>
				{/* Status bar */}
				<View style={styles.terminalHeader}>
					<View style={styles.terminalHeaderLeft}>
						<Text style={[ts, styles.terminalSessionLabel]}>
							{settings.user}@{settings.host}
						</Text>
						{progressState != null && progressState.state !== 0 && (
							<View style={styles.progressContainer}>
								<View
									style={[
										styles.progressBar,
										{
											width:
												progressState.state === 3
													? '100%'
													: `${Math.max(0, Math.min(100, progressState.value))}%`,
											backgroundColor:
												progressState.state === 2
													? '#f87171'
													: progressState.state === 4
														? '#fbbf24'
														: '#6366f1',
										},
									]}
								/>
							</View>
						)}
					</View>
					<View style={styles.terminalHeaderActions}>
						<TouchableOpacity
							onPress={() => setSnippetsVisible(true)}
							style={styles.terminalHeaderBtn}
							accessibilityRole="button"
							accessibilityLabel="Open snippets"
						>
							<MaterialCommunityIcons
								name="code-braces"
								size={16}
								color="#a1a1aa"
							/>
							<Text style={[ts, styles.terminalHeaderBtnLabel]}>Snippets</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/settings')}
							style={styles.terminalHeaderBtn}
							accessibilityRole="button"
							accessibilityLabel="Open settings"
						>
							<MaterialCommunityIcons
								name="cog-outline"
								size={16}
								color="#a1a1aa"
							/>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => disconnect()}
							style={[styles.terminalHeaderBtn, styles.terminalDisconnectBtn]}
							accessibilityRole="button"
							accessibilityLabel="Disconnect"
						>
							<MaterialCommunityIcons name="power" size={16} color="#f87171" />
							<Text style={[ts, styles.terminalDisconnectLabel]}>Exit</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.terminalBody}>
					<TerminalView
						output={output}
						onData={sendData}
						fontSize={
							appSettings.fontSize === 'small'
								? 11
								: appSettings.fontSize === 'large'
									? 15
									: 13
						}
						onProgress={setProgressState}
					/>
				</View>

				{/* Toolbar sits just above the keyboard thanks to paddingBottom */}
				<TerminalToolbar onSend={sendData} colors={terminalColors} />
			</View>

			<SnippetManagerModal
				isVisible={isSnippetsVisible}
				onClose={() => setSnippetsVisible(false)}
				onSelect={handleSnippetSelect}
			/>
		</SafeAreaView>
	)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	screen: {flex: 1},
	scroll: {flex: 1},
	scrollContent: {paddingHorizontal: 16, paddingVertical: 32},

	// App header
	appHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 28,
	},
	appHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
	appHeaderText: {gap: 2},
	appIcon: {fontSize: 36},
	appTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: '#ffffff',
		letterSpacing: -0.5,
	},
	appSubtitle: {fontSize: 12, color: '#71717a'},
	settingsBtn: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#18181b',
	},

	// Section
	section: {marginBottom: 28},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: '700',
		color: '#a1a1aa',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},

	// Profile list
	addProfileBtn: {flexDirection: 'row', alignItems: 'center', gap: 4},
	addProfileLabel: {color: '#6366f1', fontWeight: '600', fontSize: 13},
	noProfilesHint: {color: '#52525b', fontSize: 13, fontStyle: 'italic'},
	profileCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderLeftWidth: 4,
		borderRadius: 10,
		marginBottom: 8,
		overflow: 'hidden',
	},
	profileCardInfo: {flex: 1, paddingVertical: 12, paddingHorizontal: 14},
	profileName: {color: '#f4f4f5', fontWeight: '600', fontSize: 14},
	profileDesc: {color: '#71717a', fontSize: 12, marginTop: 1},
	profileHost: {
		color: '#6b7280',
		fontSize: 11,
		marginTop: 3,
		fontFamily: 'monospace',
	},
	profileCardActions: {
		flexDirection: 'row',
		paddingRight: 8,
		gap: 4,
	},
	profileActionBtn: {padding: 8},

	// Quick-connect form
	formRow: {flexDirection: 'row', gap: 10},
	formFieldFlex: {flex: 1},
	formFieldPort: {width: 80},
	fieldLabel: {
		fontSize: 11,
		fontWeight: '600',
		color: '#71717a',
		marginBottom: 5,
		marginTop: 10,
		textTransform: 'uppercase',
		letterSpacing: 0.4,
	},
	input: {
		backgroundColor: '#18181b',
		borderWidth: 1,
		borderColor: '#3f3f46',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: Platform.OS === 'ios' ? 11 : 9,
		color: '#f4f4f5',
		fontSize: 14,
	},
	authModeRow: {flexDirection: 'row', gap: 8, marginBottom: 4},
	authModeChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#3f3f46',
		backgroundColor: '#18181b',
	},
	authModeChipActive: {
		backgroundColor: '#312e81',
		borderColor: '#6366f1',
	},
	authModeChipLabel: {color: '#a1a1aa', fontSize: 12, fontWeight: '600'},
	authModeChipLabelActive: {color: '#ffffff'},
	authHint: {color: '#71717a', fontSize: 12, lineHeight: 18, marginTop: 6},
	keyInput: {
		minHeight: 120,
		textAlignVertical: 'top',
		fontFamily: 'monospace',
	},
	errorText: {color: '#f87171', fontSize: 12, marginTop: 6},
	connectBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 16,
		paddingVertical: 14,
		borderRadius: 10,
		backgroundColor: '#6366f1',
	},
	connectBtnDisabled: {backgroundColor: '#3f3f46'},
	connectBtnLabel: {color: '#ffffff', fontWeight: '700', fontSize: 15},
	saveProfileBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		marginTop: 10,
		paddingVertical: 11,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#3f3f46',
	},
	saveProfileLabel: {color: '#71717a', fontSize: 13},

	// Discovery
	scanningLabel: {color: '#52525b', fontSize: 10},
	discoveredHost: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 11,
		marginBottom: 6,
		backgroundColor: '#18181b',
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: '#27272a',
	},
	discoveredName: {color: '#e4e4e7', fontSize: 13},
	discoveredAddr: {color: '#52525b', fontSize: 12, fontFamily: 'monospace'},
	noDevicesText: {color: '#3f3f46', fontSize: 12, fontStyle: 'italic'},
	rescanBtn: {flexDirection: 'row', alignItems: 'center', gap: 4},
	rescanLabel: {color: '#6366f1', fontSize: 12},
	scanErrorText: {color: '#f87171', fontSize: 12, fontStyle: 'italic'},
	scanInfoText: {
		color: '#71717a',
		fontSize: 12,
		fontStyle: 'italic',
		lineHeight: 18,
	},
	discoveryDisabledText: {color: '#a1a1aa', fontSize: 12, marginBottom: 8},

	// Terminal session screen
	terminalScreen: {flex: 1, backgroundColor: '#000000'},
	kavFlex: {flex: 1, overflow: 'hidden'},
	terminalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#27272a',
		backgroundColor: '#18181b',
	},
	terminalHeaderLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	terminalSessionLabel: {
		color: '#71717a',
		fontSize: 12,
		fontFamily: 'monospace',
	},
	progressContainer: {
		flex: 1,
		height: 3,
		backgroundColor: '#27272a',
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressBar: {
		height: '100%',
		borderRadius: 2,
	},
	terminalHeaderActions: {flexDirection: 'row', gap: 8},
	terminalHeaderBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
		backgroundColor: '#27272a',
	},
	terminalHeaderBtnLabel: {color: '#a1a1aa', fontSize: 12},
	terminalDisconnectBtn: {backgroundColor: 'rgba(239,68,68,0.12)'},
	terminalDisconnectLabel: {color: '#f87171', fontSize: 12},
	terminalBody: {flex: 1},
})
