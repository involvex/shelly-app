import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type {SSHProfileSecrets} from '../store/useSSHProfiles'
import {SafeAreaView} from 'react-native-safe-area-context'
import type {SSHProfile} from '../store/useSSHProfiles'
import {PROFILE_COLORS} from '../theme/terminal'
import React, {useEffect, useState} from 'react'
import type {SSHAuthMode} from '@shelly/shared'
import {scaleText} from 'react-native-text'

const ts = scaleText({fontSize: 14})

const TERMINAL_TYPES = ['xterm-256color', 'xterm', 'vt100'] as const
type TerminalType = (typeof TERMINAL_TYPES)[number]

interface ProfileFormModalProps {
	visible: boolean
	onClose: () => void
	/** Called with the new/updated profile data and secrets. Throw to show an error. */
	onSave: (
		profile: Omit<SSHProfile, 'id'>,
		secrets: SSHProfileSecrets,
	) => Promise<void>
	/** When provided the form opens pre-populated for editing. */
	initialProfile?: SSHProfile
	/** Current saved secrets for an existing profile. */
	initialSecrets?: SSHProfileSecrets
}

interface FormState {
	name: string
	description: string
	host: string
	port: string
	user: string
	authMode: SSHAuthMode
	password: string
	privateKey: string
	keyPassphrase: string
	showPassword: boolean
	showPrivateKey: boolean
	showKeyPassphrase: boolean
	terminalType: string
	startupCommand: string
	color: string
	showAdvanced: boolean
}

const EMPTY: FormState = {
	name: '',
	description: '',
	host: '',
	port: '22',
	user: '',
	authMode: 'password',
	password: '',
	privateKey: '',
	keyPassphrase: '',
	showPassword: false,
	showPrivateKey: false,
	showKeyPassphrase: false,
	terminalType: 'xterm-256color',
	startupCommand: '',
	color: PROFILE_COLORS[0],
	showAdvanced: false,
}

/**
 * Full-screen bottom-sheet modal for creating or editing an SSH profile.
 *
 * Field layout:
 *  ┌─ Profile Color ──────────────────────────────────────┐
 *  │  ● ● ● ● ● ● ● ●                                     │
 *  ├─ Connection ─────────────────────────────────────────┤
 *  │  Name*, Description                                   │
 *  │  Host*  Port                                          │
 *  │  Username*  Password (show/hide)                      │
 *  └─ Advanced (collapsible) ─────────────────────────────┘
 *     Terminal Type (segmented), Startup Command
 */
export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
	visible,
	onClose,
	onSave,
	initialProfile,
	initialSecrets,
}) => {
	const isEditing = !!initialProfile
	const [form, setForm] = useState<FormState>(EMPTY)
	const [saving, setSaving] = useState(false)
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({})

	// Populate / reset form each time the modal opens.
	useEffect(() => {
		if (!visible) return
		if (initialProfile) {
			setForm({
				...EMPTY,
				name: initialProfile.name,
				description: initialProfile.description ?? '',
				host: initialProfile.host,
				port: initialProfile.port,
				user: initialProfile.user,
				authMode: initialProfile.authMode ?? 'password',
				password: initialSecrets?.password ?? '',
				privateKey: initialSecrets?.privateKey ?? '',
				keyPassphrase: initialSecrets?.keyPassphrase ?? '',
				terminalType: initialProfile.terminalType ?? 'xterm-256color',
				startupCommand: initialProfile.startupCommand ?? '',
				color: initialProfile.color ?? PROFILE_COLORS[0],
			})
		} else {
			setForm(EMPTY)
		}
		setErrors({})
		setSaving(false)
	}, [visible, initialProfile, initialSecrets])

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm(prev => ({...prev, [key]: value}))

	const validate = (): boolean => {
		const errs: Partial<Record<keyof FormState, string>> = {}
		if (!form.name.trim()) errs.name = 'Name is required'
		if (!form.host.trim()) errs.host = 'Host is required'
		const port = parseInt(form.port, 10)
		if (isNaN(port) || port < 1 || port > 65535) errs.port = '1–65535'
		if (!form.user.trim()) errs.user = 'Username is required'
		if (form.authMode === 'key' && !form.privateKey.trim()) {
			errs.privateKey = 'Private key is required'
		}
		setErrors(errs)
		return Object.keys(errs).length === 0
	}

	const handleSave = async () => {
		if (!validate()) return
		setSaving(true)
		try {
			await onSave(
				{
					name: form.name.trim(),
					description: form.description.trim() || undefined,
					host: form.host.trim(),
					port: form.port.trim() || '22',
					user: form.user.trim(),
					authMode: form.authMode,
					terminalType: form.terminalType as TerminalType,
					startupCommand: form.startupCommand.trim() || undefined,
					color: form.color,
				},
				{
					password: form.password,
					privateKey: form.privateKey,
					keyPassphrase: form.keyPassphrase,
				},
			)
			onClose()
		} catch {
			// Parent is responsible for showing the error; we just re-enable the button.
		} finally {
			setSaving(false)
		}
	}

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<View style={styles.backdrop}>
				<KeyboardAvoidingView
					style={styles.kavWrapper}
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				>
					<SafeAreaView style={styles.sheet} edges={['bottom']}>
						{/* ── Header ── */}
						<View style={styles.header}>
							<Text style={[ts, styles.headerTitle]}>
								{isEditing ? 'Edit Profile' : 'New Profile'}
							</Text>
							<TouchableOpacity
								onPress={onClose}
								hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
								accessibilityLabel="Close"
								accessibilityRole="button"
							>
								<MaterialCommunityIcons
									name="close"
									size={22}
									color="#a1a1aa"
								/>
							</TouchableOpacity>
						</View>

						{/* ── Form body ── */}
						<ScrollView
							style={styles.scroll}
							contentContainerStyle={styles.scrollContent}
							keyboardShouldPersistTaps="handled"
						>
							{/* Color picker */}
							<Text style={[ts, styles.sectionLabel]}>Profile Color</Text>
							<View style={styles.colorRow}>
								{PROFILE_COLORS.map(c => (
									<TouchableOpacity
										key={c}
										onPress={() => set('color', c)}
										style={[
											styles.colorDot,
											{backgroundColor: c},
											form.color === c && styles.colorDotSelected,
										]}
										accessibilityLabel={`Profile color ${c}`}
										accessibilityRole="radio"
										accessibilityState={{selected: form.color === c}}
									/>
								))}
							</View>

							{/* Name */}
							<FormField label="Name" required error={errors.name}>
								<TextInput
									value={form.name}
									onChangeText={v => set('name', v)}
									placeholder="My Server"
									placeholderTextColor="#4b5563"
									style={[styles.input, errors.name && styles.inputError]}
									accessibilityLabel="Profile name"
								/>
							</FormField>

							{/* Description */}
							<FormField label="Description">
								<TextInput
									value={form.description}
									onChangeText={v => set('description', v)}
									placeholder="Optional notes…"
									placeholderTextColor="#4b5563"
									style={styles.input}
									accessibilityLabel="Profile description"
								/>
							</FormField>

							{/* Host + Port on the same row */}
							<View style={styles.twoCol}>
								<FormField
									label="Host"
									required
									error={errors.host}
									style={styles.flex}
								>
									<TextInput
										value={form.host}
										onChangeText={v => set('host', v)}
										placeholder="192.168.1.1"
										placeholderTextColor="#4b5563"
										autoCapitalize="none"
										autoCorrect={false}
										keyboardType="url"
										style={[styles.input, errors.host && styles.inputError]}
										accessibilityLabel="SSH host"
									/>
								</FormField>
								<FormField
									label="Port"
									error={errors.port}
									style={styles.portCol}
								>
									<TextInput
										value={form.port}
										onChangeText={v => set('port', v)}
										placeholder="22"
										placeholderTextColor="#4b5563"
										keyboardType="number-pad"
										style={[styles.input, errors.port && styles.inputError]}
										accessibilityLabel="SSH port"
									/>
								</FormField>
							</View>

							{/* Username */}
							<FormField label="Username" required error={errors.user}>
								<TextInput
									value={form.user}
									onChangeText={v => set('user', v)}
									placeholder="root"
									placeholderTextColor="#4b5563"
									autoCapitalize="none"
									autoCorrect={false}
									style={[styles.input, errors.user && styles.inputError]}
									accessibilityLabel="SSH username"
								/>
							</FormField>

							<FormField label="Authentication">
								<View style={styles.segmentRow}>
									{(['password', 'key'] as const).map(mode => (
										<TouchableOpacity
											key={mode}
											onPress={() => set('authMode', mode)}
											style={[
												styles.segment,
												form.authMode === mode && styles.segmentActive,
											]}
											accessibilityRole="radio"
											accessibilityState={{selected: form.authMode === mode}}
										>
											<Text
												style={[
													ts,
													styles.segmentLabel,
													form.authMode === mode && styles.segmentLabelActive,
												]}
											>
												{mode === 'password' ? 'Password' : 'SSH Key'}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</FormField>

							{form.authMode === 'password' ? (
								<FormField label="Password">
									<View style={styles.passwordRow}>
										<TextInput
											value={form.password}
											onChangeText={v => set('password', v)}
											secureTextEntry={!form.showPassword}
											placeholder="••••••••"
											placeholderTextColor="#4b5563"
											style={[styles.input, styles.flex]}
											accessibilityLabel="SSH password"
										/>
										<TouchableOpacity
											onPress={() => set('showPassword', !form.showPassword)}
											style={styles.eyeBtn}
											accessibilityLabel={
												form.showPassword ? 'Hide password' : 'Show password'
											}
											accessibilityRole="button"
										>
											<MaterialCommunityIcons
												name={form.showPassword ? 'eye-off' : 'eye'}
												size={20}
												color="#6b7280"
											/>
										</TouchableOpacity>
									</View>
								</FormField>
							) : (
								<>
									<FormField
										label="Private Key"
										required
										error={errors.privateKey}
									>
										<View style={styles.passwordRow}>
											<TextInput
												value={form.privateKey}
												onChangeText={v => set('privateKey', v)}
												secureTextEntry={!form.showPrivateKey}
												placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
												placeholderTextColor="#4b5563"
												multiline
												style={[
													styles.input,
													styles.flex,
													styles.textAreaInput,
												]}
												accessibilityLabel="SSH private key"
											/>
											<TouchableOpacity
												onPress={() =>
													set('showPrivateKey', !form.showPrivateKey)
												}
												style={styles.eyeBtn}
												accessibilityLabel={
													form.showPrivateKey
														? 'Hide private key'
														: 'Show private key'
												}
												accessibilityRole="button"
											>
												<MaterialCommunityIcons
													name={form.showPrivateKey ? 'eye-off' : 'eye'}
													size={20}
													color="#6b7280"
												/>
											</TouchableOpacity>
										</View>
									</FormField>
									<FormField label="Key Passphrase">
										<View style={styles.passwordRow}>
											<TextInput
												value={form.keyPassphrase}
												onChangeText={v => set('keyPassphrase', v)}
												secureTextEntry={!form.showKeyPassphrase}
												placeholder="Optional passphrase"
												placeholderTextColor="#4b5563"
												style={[styles.input, styles.flex]}
												accessibilityLabel="SSH key passphrase"
											/>
											<TouchableOpacity
												onPress={() =>
													set('showKeyPassphrase', !form.showKeyPassphrase)
												}
												style={styles.eyeBtn}
												accessibilityLabel={
													form.showKeyPassphrase
														? 'Hide key passphrase'
														: 'Show key passphrase'
												}
												accessibilityRole="button"
											>
												<MaterialCommunityIcons
													name={form.showKeyPassphrase ? 'eye-off' : 'eye'}
													size={20}
													color="#6b7280"
												/>
											</TouchableOpacity>
										</View>
									</FormField>
								</>
							)}

							{/* Advanced section toggle */}
							<TouchableOpacity
								onPress={() => set('showAdvanced', !form.showAdvanced)}
								style={styles.advancedToggle}
								accessibilityRole="button"
								accessibilityLabel={
									form.showAdvanced
										? 'Hide advanced options'
										: 'Show advanced options'
								}
							>
								<Text style={[ts, styles.advancedToggleLabel]}>
									Advanced Options
								</Text>
								<MaterialCommunityIcons
									name={form.showAdvanced ? 'chevron-up' : 'chevron-down'}
									size={18}
									color="#52525b"
								/>
							</TouchableOpacity>

							{form.showAdvanced && (
								<>
									{/* Terminal type segmented control */}
									<FormField label="Terminal Type">
										<View style={styles.segmentRow}>
											{TERMINAL_TYPES.map(t => (
												<TouchableOpacity
													key={t}
													onPress={() => set('terminalType', t)}
													style={[
														styles.segment,
														form.terminalType === t && styles.segmentActive,
													]}
													accessibilityRole="radio"
													accessibilityState={{
														selected: form.terminalType === t,
													}}
												>
													<Text
														style={[
															ts,
															styles.segmentLabel,
															form.terminalType === t &&
																styles.segmentLabelActive,
														]}
													>
														{t}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									</FormField>

									{/* Startup command */}
									<FormField label="Startup Command">
										<TextInput
											value={form.startupCommand}
											onChangeText={v => set('startupCommand', v)}
											placeholder="e.g. cd ~/projects && tmux"
											placeholderTextColor="#4b5563"
											autoCapitalize="none"
											autoCorrect={false}
											style={styles.input}
											accessibilityLabel="Startup command"
										/>
									</FormField>
								</>
							)}

							<View style={{height: 20}} />
						</ScrollView>

						{/* ── Footer ── */}
						<View style={styles.footer}>
							<TouchableOpacity
								onPress={onClose}
								style={styles.cancelBtn}
								accessibilityRole="button"
								accessibilityLabel="Cancel"
							>
								<Text style={[ts, styles.cancelLabel]}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSave}
								disabled={saving}
								style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
								accessibilityRole="button"
								accessibilityLabel={saving ? 'Saving…' : 'Save profile'}
							>
								<Text style={[ts, styles.saveLabel]}>
									{saving ? 'Saving…' : 'Save'}
								</Text>
							</TouchableOpacity>
						</View>
					</SafeAreaView>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	)
}

// ─── Helper ──────────────────────────────────────────────────────────────────

interface FormFieldProps {
	label: string
	required?: boolean
	error?: string
	children: React.ReactNode
	style?: object
}

const FormField: React.FC<FormFieldProps> = ({
	label,
	required,
	error,
	children,
	style,
}) => (
	<View style={[{marginTop: 14}, style]}>
		<Text style={[ts, styles.fieldLabel]}>
			{label}
			{required && <Text style={styles.required}> *</Text>}
		</Text>
		{children}
		{error != null && error !== '' && (
			<Text style={styles.errorMsg}>{error}</Text>
		)}
	</View>
)

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.75)',
		justifyContent: 'flex-end',
	},
	kavWrapper: {
		flex: 1,
		maxHeight: '92%',
	},
	sheet: {
		flex: 1,
		backgroundColor: '#18181b',
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 18,
		paddingTop: 18,
		paddingBottom: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#27272a',
	},
	headerTitle: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: '700',
	},
	scroll: {flex: 1},
	scrollContent: {paddingHorizontal: 18, paddingTop: 8},
	sectionLabel: {
		color: '#71717a',
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginTop: 16,
		marginBottom: 8,
	},
	colorRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	colorDot: {
		width: 30,
		height: 30,
		borderRadius: 15,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	colorDotSelected: {
		borderColor: '#ffffff',
		transform: [{scale: 1.2}],
	},
	fieldLabel: {
		color: '#a1a1aa',
		fontSize: 11,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 6,
	},
	required: {color: '#f87171'},
	input: {
		backgroundColor: '#27272a',
		borderWidth: 1,
		borderColor: '#3f3f46',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: Platform.OS === 'ios' ? 11 : 9,
		color: '#f4f4f5',
		fontSize: 15,
	},
	textAreaInput: {
		minHeight: 120,
		textAlignVertical: 'top',
		fontFamily: 'monospace',
	},
	inputError: {borderColor: '#f87171'},
	errorMsg: {color: '#f87171', fontSize: 11, marginTop: 4},
	twoCol: {flexDirection: 'row', gap: 10},
	flex: {flex: 1},
	portCol: {width: 82},
	passwordRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
	eyeBtn: {padding: 8},
	advancedToggle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 20,
		paddingVertical: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#27272a',
	},
	advancedToggleLabel: {color: '#52525b', fontSize: 13, flex: 1},
	segmentRow: {
		flexDirection: 'row',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#3f3f46',
		overflow: 'hidden',
	},
	segment: {
		flex: 1,
		paddingVertical: 9,
		alignItems: 'center',
		backgroundColor: '#27272a',
	},
	segmentActive: {backgroundColor: '#6366f1'},
	segmentLabel: {color: '#71717a', fontSize: 11, fontWeight: '600'},
	segmentLabelActive: {color: '#ffffff'},
	footer: {
		flexDirection: 'row',
		gap: 12,
		paddingHorizontal: 18,
		paddingVertical: 14,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#27272a',
	},
	cancelBtn: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#3f3f46',
	},
	cancelLabel: {color: '#a1a1aa', fontWeight: '600', fontSize: 15},
	saveBtn: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 10,
		alignItems: 'center',
		backgroundColor: '#6366f1',
	},
	saveBtnDisabled: {opacity: 0.55},
	saveLabel: {color: '#ffffff', fontWeight: '700', fontSize: 15},
})
