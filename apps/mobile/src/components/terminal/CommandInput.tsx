import {
	TERMINAL_COLORS,
	TERMINAL_FONT,
	TERMINAL_SPACING,
} from '../../theme/terminal'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native'
import type {TextInput as RNTextInput, ViewStyle} from 'react-native'
import {TerminalPrompt} from './TerminalPrompt'
import React, {useState} from 'react'

interface CommandInputProps {
	value: string
	onChangeText: (text: string) => void
	/** Called when the user presses Enter / the Send button. */
	onSubmit: () => void
	/** Navigate to the previous (older) command in history. */
	onNavigateUp: () => void
	/** Navigate to the next (newer) command in history, or clear the field. */
	onNavigateDown: () => void
	inputRef?: React.RefObject<RNTextInput | null>
	style?: ViewStyle
}

/**
 * The command input row rendered at the bottom of the terminal.
 *
 * Layout (left → right):
 *   [↑] [↓]  ›  [text input …]  [send]
 *
 * Focus state drives the accent border and prompt colour so the user has a
 * clear visual affordance for where keyboard input will land.
 */
export const CommandInput: React.FC<CommandInputProps> = ({
	value,
	onChangeText,
	onSubmit,
	onNavigateUp,
	onNavigateDown,
	inputRef,
	style,
}) => {
	const [isFocused, setIsFocused] = useState(false)

	return (
		<View
			style={[
				styles.container,
				isFocused ? styles.containerFocused : styles.containerIdle,
				style,
			]}
		>
			{/* History navigation */}
			<TouchableOpacity
				onPress={onNavigateUp}
				style={styles.navBtn}
				accessibilityLabel="Previous command"
				accessibilityRole="button"
				hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
			>
				<MaterialCommunityIcons
					name="arrow-up"
					size={18}
					color={TERMINAL_COLORS.mutedText}
				/>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={onNavigateDown}
				style={styles.navBtn}
				accessibilityLabel="Next command"
				accessibilityRole="button"
				hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}
			>
				<MaterialCommunityIcons
					name="arrow-down"
					size={18}
					color={TERMINAL_COLORS.mutedText}
				/>
			</TouchableOpacity>

			{/* Prompt glyph — accent when focused, muted when idle */}
			<TerminalPrompt variant={isFocused ? 'default' : 'muted'} />

			{/* Command text field */}
			<TextInput
				ref={inputRef}
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmit}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				returnKeyType="send"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="off"
				blurOnSubmit={false}
				placeholderTextColor={TERMINAL_COLORS.subtleText}
				placeholder="type command…"
				selectionColor={TERMINAL_COLORS.accent}
				accessibilityLabel="Terminal command input"
				accessibilityHint="Type a shell command and press Enter or the send button"
			/>

			{/* Send button */}
			<TouchableOpacity
				onPress={onSubmit}
				style={styles.sendBtn}
				activeOpacity={0.7}
				accessibilityLabel="Send command"
				accessibilityRole="button"
				hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}
			>
				<MaterialCommunityIcons
					name="send"
					size={18}
					color={isFocused ? TERMINAL_COLORS.accent : TERMINAL_COLORS.mutedText}
				/>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 1,
		paddingHorizontal: TERMINAL_SPACING.inputPaddingH,
		paddingVertical: TERMINAL_SPACING.inputPaddingV,
	},
	containerIdle: {
		backgroundColor: TERMINAL_COLORS.surface,
		borderTopColor: TERMINAL_COLORS.border,
	},
	containerFocused: {
		backgroundColor: TERMINAL_COLORS.surfaceActive,
		borderTopColor: TERMINAL_COLORS.borderActive,
	},
	navBtn: {
		paddingHorizontal: 6,
		paddingVertical: 4,
	},
	input: {
		flex: 1,
		color: TERMINAL_COLORS.commandText,
		fontFamily: TERMINAL_FONT.family,
		fontSize: TERMINAL_FONT.size,
		lineHeight: TERMINAL_FONT.lineHeight,
		paddingVertical: 4,
		paddingLeft: 2,
		minHeight: 32,
	},
	sendBtn: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
})
