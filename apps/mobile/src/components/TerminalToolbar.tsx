import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {useKeybarStore} from '../store/useKeybarStore'
import type {TerminalColors} from '../theme/terminal'
import {TERMINAL_COLORS} from '../theme/terminal'
import * as Clipboard from 'expo-clipboard'
import React, {useEffect} from 'react'
import {router} from 'expo-router'

interface TerminalToolbarProps {
	onSend: (data: string) => void
	colors?: TerminalColors
	/** Returns the current text buffered in the command input. */
	getInputText?: () => string
	/** Clears the command input buffer. */
	clearInput?: () => void
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
	onSend,
	colors = TERMINAL_COLORS,
	getInputText,
	clearInput,
}) => {
	const {rows, isExpanded, collapsedRowCount, load, toggleExpanded} =
		useKeybarStore()

	useEffect(() => {
		void load()
	}, [load])

	const visibleRows = isExpanded ? rows : rows.slice(0, collapsedRowCount)
	const hasMoreRows = rows.length > collapsedRowCount

	const handlePaste = async () => {
		try {
			const text = await Clipboard.getStringAsync()
			if (text) onSend(text)
		} catch {
			// Clipboard access may be denied on iOS/Android
		}
	}

	// Flush any buffered command input before sending a keybar code so the shell
	// sees the full line — e.g. "git sta\t" instead of just "\t".
	// For bare control codes (\x03 Ctrl+C etc.) we skip the prefix so they work
	// even when the input buffer is empty.
	const handleButtonPress = (code: string) => {
		const prefix = getInputText ? getInputText() : ''
		if (prefix) {
			onSend(prefix + code)
			clearInput?.()
		} else {
			onSend(code)
		}
	}

	return (
		<View
			style={[
				styles.wrapper,
				{backgroundColor: colors.surface, borderTopColor: colors.border},
			]}
		>
			{/* Key rows — each row scrolls horizontally */}
			{visibleRows.map(row => (
				<ScrollView
					key={row.id}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.rowContent}
					style={styles.row}
				>
					{row.buttons.map(btn => (
						<TouchableOpacity
							key={btn.id}
							onPress={() => handleButtonPress(btn.code)}
							style={[styles.keyBtn, {backgroundColor: colors.surfaceActive}]}
							accessibilityRole="button"
							accessibilityLabel={btn.label}
						>
							{btn.icon ? (
								<MaterialCommunityIcons
									name={btn.icon as never}
									size={15}
									color="#e2e2e6"
								/>
							) : (
								<Text style={styles.keyLabel}>{btn.label}</Text>
							)}
						</TouchableOpacity>
					))}
				</ScrollView>
			))}

			{/* Control bar: paste | expand toggle + gear */}
			<View style={[styles.controlBar, {borderTopColor: colors.border}]}>
				<TouchableOpacity
					onPress={() => void handlePaste()}
					style={[styles.pasteBtn, {backgroundColor: colors.accent}]}
					accessibilityRole="button"
					accessibilityLabel="Paste from clipboard"
				>
					<MaterialCommunityIcons name="content-paste" size={14} color="#fff" />
					<Text style={styles.pasteBtnLabel}>Paste</Text>
				</TouchableOpacity>

				<View style={styles.ctrlRight}>
					{hasMoreRows && (
						<TouchableOpacity
							onPress={toggleExpanded}
							style={styles.ctrlIconBtn}
							accessibilityRole="button"
							accessibilityLabel={
								isExpanded ? 'Collapse keybar' : 'Expand keybar'
							}
						>
							<MaterialCommunityIcons
								name={isExpanded ? 'chevron-down' : 'chevron-up'}
								size={18}
								color={colors.mutedText}
							/>
							<Text style={[styles.ctrlMuted, {color: colors.mutedText}]}>
								{isExpanded
									? `${rows.length} rows`
									: `+${rows.length - collapsedRowCount}`}
							</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						onPress={() => router.push('/keybar-editor')}
						style={styles.ctrlIconBtn}
						accessibilityRole="button"
						accessibilityLabel="Edit keybar rows"
					>
						<MaterialCommunityIcons
							name="keyboard-settings-outline"
							size={18}
							color={colors.mutedText}
						/>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		borderTopWidth: 1,
	},
	row: {
		paddingVertical: 3,
	},
	rowContent: {
		paddingHorizontal: 4,
		gap: 4,
	},
	keyBtn: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 11,
		paddingVertical: 7,
		borderRadius: 6,
		minWidth: 38,
	},
	keyLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#e2e2e6',
		letterSpacing: 0.2,
	},
	controlBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 6,
		paddingVertical: 4,
		borderTopWidth: StyleSheet.hairlineWidth,
		gap: 8,
	},
	pasteBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 6,
		gap: 4,
	},
	pasteBtnLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#fff',
	},
	ctrlRight: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		gap: 4,
	},
	ctrlIconBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 6,
		paddingVertical: 5,
		gap: 3,
	},
	ctrlMuted: {
		fontSize: 11,
		fontWeight: '500',
	},
})
