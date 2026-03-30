import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {useAppSettings, FONT_SIZE_STEPS} from '@/store/useAppSettings'
import type {TerminalThemeKey, TerminalColors} from '@/theme/terminal'
import type {TerminalType} from '@/store/useAppSettings'
import {TERMINAL_THEMES} from '@/theme/terminal'

const TERMINAL_TYPE_OPTIONS: {
	value: TerminalType
	label: string
	hint: string
}[] = [
	{
		value: 'xterm-256color',
		label: 'xterm-256color',
		hint: '256-colour · recommended',
	},
	{value: 'xterm', label: 'xterm', hint: 'Standard xterm'},
	{value: 'vt100', label: 'vt100', hint: 'Legacy VT100'},
	{value: 'vt102', label: 'vt102', hint: 'Legacy VT102'},
	{value: 'vt220', label: 'vt220', hint: 'VT220'},
	{value: 'ansi', label: 'ansi', hint: 'ANSI'},
	{value: 'vanilla', label: 'vanilla', hint: 'Minimal / no escape codes'},
]

function MiniPreview({colors}: {colors: TerminalColors}) {
	return (
		<View
			style={[
				mp.wrap,
				{backgroundColor: colors.background, borderColor: colors.border},
			]}
		>
			<Text style={[mp.line, {color: colors.promptColor}]}>
				{'$ '}
				<Text style={{color: colors.commandText}}>ls</Text>
			</Text>
			<Text style={[mp.line, {color: colors.successText}]}>apps/ src/</Text>
		</View>
	)
}

const mp = StyleSheet.create({
	wrap: {
		width: 76,
		height: 30,
		borderRadius: 4,
		borderWidth: 1,
		paddingHorizontal: 4,
		paddingVertical: 2,
		justifyContent: 'center',
	},
	line: {
		fontSize: 7,
		lineHeight: 10,
	},
})

export default function SettingsScreen() {
	const {settings, update} = useAppSettings()
	const fontSize =
		typeof settings.fontSize === 'number' ? settings.fontSize : 13
	const fsIdx = FONT_SIZE_STEPS.indexOf(fontSize)

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			{/* ── Terminal Theme ─────────────────────────────── */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Terminal Theme</Text>
				<View style={styles.card}>
					{(Object.keys(TERMINAL_THEMES) as TerminalThemeKey[]).map(
						(key, index, arr) => {
							const theme = TERMINAL_THEMES[key]
							const isSelected = settings.terminalTheme === key
							const isLast = index === arr.length - 1

							return (
								<TouchableOpacity
									key={key}
									style={[
										styles.themeRow,
										isLast && styles.themeRowLast,
										isSelected && styles.themeRowSelected,
									]}
									onPress={() => update('terminalTheme', key)}
									accessibilityRole="radio"
									accessibilityState={{checked: isSelected}}
									accessibilityLabel={`${theme.label} theme`}
								>
									{/* Mini terminal preview */}
									<MiniPreview colors={theme.colors} />

									{/* Label */}
									<Text style={styles.themeName}>{theme.label}</Text>

									{/* Checkmark */}
									{isSelected && (
										<MaterialCommunityIcons
											name="check"
											size={20}
											color="#6366f1"
										/>
									)}
								</TouchableOpacity>
							)
						},
					)}
				</View>
			</View>

			{/* ── Font Size ──────────────────────────────────── */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Font Size</Text>
				<View style={styles.card}>
					<View style={styles.fontSizeRow}>
						<TouchableOpacity
							onPress={() => {
								const prev = FONT_SIZE_STEPS[fsIdx - 1]
								if (prev !== undefined) update('fontSize', prev)
							}}
							disabled={fsIdx <= 0}
							style={[styles.fsStepBtn, fsIdx <= 0 && styles.fsStepBtnDisabled]}
							accessibilityLabel="Decrease font size"
						>
							<MaterialCommunityIcons
								name="minus"
								size={20}
								color={fsIdx <= 0 ? '#3a3a3e' : '#e2e2e6'}
							/>
						</TouchableOpacity>

						<View style={styles.fsValueWrap}>
							<Text style={styles.fsValue}>{fontSize}</Text>
							<Text style={styles.fsPx}>px</Text>
						</View>

						<TouchableOpacity
							onPress={() => {
								const next = FONT_SIZE_STEPS[fsIdx + 1]
								if (next !== undefined) update('fontSize', next)
							}}
							disabled={fsIdx >= FONT_SIZE_STEPS.length - 1}
							style={[
								styles.fsStepBtn,
								fsIdx >= FONT_SIZE_STEPS.length - 1 && styles.fsStepBtnDisabled,
							]}
							accessibilityLabel="Increase font size"
						>
							<MaterialCommunityIcons
								name="plus"
								size={20}
								color={
									fsIdx >= FONT_SIZE_STEPS.length - 1 ? '#3a3a3e' : '#e2e2e6'
								}
							/>
						</TouchableOpacity>
					</View>
					{/* Step dots */}
					<View style={styles.fsDotsRow}>
						{FONT_SIZE_STEPS.map((s, i) => (
							<TouchableOpacity
								key={s}
								onPress={() => update('fontSize', s)}
								style={[styles.fsDot, i === fsIdx && styles.fsDotActive]}
								accessibilityLabel={`Font size ${s}px`}
							/>
						))}
					</View>
				</View>
			</View>

			{/* ── Terminal Type ──────────────────────────────── */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Terminal Type</Text>
				<View style={styles.card}>
					{TERMINAL_TYPE_OPTIONS.map(({value, label, hint}, index) => {
						const isSelected = settings.terminalType === value
						const isLast = index === TERMINAL_TYPE_OPTIONS.length - 1

						return (
							<TouchableOpacity
								key={value}
								style={[styles.optionRow, isLast && styles.optionRowLast]}
								onPress={() => update('terminalType', value)}
								accessibilityRole="radio"
								accessibilityState={{checked: isSelected}}
								accessibilityLabel={`Terminal type ${label}`}
							>
								<View style={styles.optionLeft}>
									<Text style={styles.optionLabel}>{label}</Text>
									<Text style={styles.optionHint}>{hint}</Text>
								</View>
								{isSelected ? (
									<MaterialCommunityIcons
										name="check"
										size={20}
										color="#6366f1"
									/>
								) : (
									<View style={styles.radioEmpty} />
								)}
							</TouchableOpacity>
						)
					})}
				</View>
			</View>

			{/* ── Connection ─────────────────────────────────── */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Connection</Text>
				<View style={styles.card}>
					{[0, 15, 30, 60].map((interval, index) => {
						const isSelected = settings.keepAliveInterval === interval
						const isLast = index === 3
						const label = interval === 0 ? 'Disabled' : `Every ${interval}s`

						return (
							<TouchableOpacity
								key={interval}
								style={[styles.optionRow, isLast && styles.optionRowLast]}
								onPress={() => update('keepAliveInterval', interval)}
								accessibilityRole="radio"
								accessibilityState={{checked: isSelected}}
								accessibilityLabel={`Keep-alive ${label}`}
							>
								<View style={styles.optionLeft}>
									<Text style={styles.optionLabel}>Keep-alive</Text>
									<Text style={styles.optionHint}>{label}</Text>
								</View>
								{isSelected ? (
									<MaterialCommunityIcons
										name="check"
										size={20}
										color="#6366f1"
									/>
								) : (
									<View style={styles.radioEmpty} />
								)}
							</TouchableOpacity>
						)
					})}
				</View>
			</View>

			{/* ── Version info ───────────────────────────────── */}
			<Text style={styles.versionText}>Shelly SSH Terminal</Text>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	content: {
		paddingHorizontal: 16,
		paddingTop: 24,
		paddingBottom: 48,
	},
	section: {
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 10,
		marginLeft: 4,
	},
	card: {
		backgroundColor: '#1c1c1e',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2a2a2e',
		overflow: 'hidden',
	},

	/* Theme rows */
	themeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#2a2a2e',
		gap: 12,
	},
	themeRowLast: {
		borderBottomWidth: 0,
	},
	themeRowSelected: {
		backgroundColor: '#23233a',
	},
	themeName: {
		flex: 1,
		fontSize: 15,
		color: '#e2e2e6',
		fontWeight: '500',
	},

	/* Font size stepper */
	fontSizeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 14,
		justifyContent: 'center',
		gap: 24,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#2a2a2e',
	},
	fsStepBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#2a2a2e',
		alignItems: 'center',
		justifyContent: 'center',
	},
	fsStepBtnDisabled: {
		opacity: 0.4,
	},
	fsValueWrap: {
		flexDirection: 'row',
		alignItems: 'baseline',
		minWidth: 60,
		justifyContent: 'center',
		gap: 2,
	},
	fsValue: {
		fontSize: 28,
		fontWeight: '700',
		color: '#e2e2e6',
	},
	fsPx: {
		fontSize: 13,
		color: '#6b7280',
	},
	fsDotsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingVertical: 10,
		gap: 4,
	},
	fsDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#3a3a3e',
	},
	fsDotActive: {
		backgroundColor: '#6366f1',
		width: 10,
	},

	/* Generic option rows */
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 13,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#2a2a2e',
	},
	optionRowLast: {
		borderBottomWidth: 0,
	},
	optionLeft: {
		flex: 1,
	},
	optionLabel: {
		fontSize: 15,
		color: '#e2e2e6',
		fontWeight: '500',
	},
	optionHint: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 1,
	},
	radioEmpty: {
		width: 20,
		height: 20,
	},

	versionText: {
		textAlign: 'center',
		fontSize: 12,
		color: '#3a3a3e',
		marginTop: 8,
	},
})
