import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type {TerminalThemeKey} from '@/theme/terminal'
import {useAppSettings} from '@/store/useAppSettings'
import type {FontSize} from '@/store/useAppSettings'
import {TERMINAL_THEMES} from '@/theme/terminal'
const FONT_SIZE_OPTIONS: {label: string; value: FontSize; hint: string}[] = [
	{label: 'Small', value: 'small', hint: '11 px'},
	{label: 'Medium', value: 'medium', hint: '13 px'},
	{label: 'Large', value: 'large', hint: '15 px'},
]

export default function SettingsScreen() {
	const {settings, update} = useAppSettings()

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
									{/* Color swatches */}
									<View style={styles.swatchRow}>
										<View
											style={[
												styles.swatch,
												{backgroundColor: theme.colors.background},
											]}
										/>
										<View
											style={[
												styles.swatchAccent,
												{backgroundColor: theme.preview},
											]}
										/>
										<View
											style={[
												styles.swatchSmall,
												{backgroundColor: theme.colors.successText},
											]}
										/>
										<View
											style={[
												styles.swatchSmall,
												{backgroundColor: theme.colors.errorText},
											]}
										/>
									</View>

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
					{FONT_SIZE_OPTIONS.map(({label, value, hint}, index) => {
						const isSelected = settings.fontSize === value
						const isLast = index === FONT_SIZE_OPTIONS.length - 1

						return (
							<TouchableOpacity
								key={value}
								style={[styles.optionRow, isLast && styles.optionRowLast]}
								onPress={() => update('fontSize', value)}
								accessibilityRole="radio"
								accessibilityState={{checked: isSelected}}
								accessibilityLabel={`Font size ${label}`}
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
		paddingVertical: 13,
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
	swatchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	swatch: {
		width: 22,
		height: 22,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#3a3a3e',
	},
	swatchAccent: {
		width: 22,
		height: 22,
		borderRadius: 5,
	},
	swatchSmall: {
		width: 10,
		height: 22,
		borderRadius: 3,
	},
	themeName: {
		flex: 1,
		fontSize: 15,
		color: '#e2e2e6',
		fontWeight: '500',
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
