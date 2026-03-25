import {
	TERMINAL_COLORS,
	TERMINAL_FONT,
	TERMINAL_SPACING,
} from '../../theme/terminal'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native'
import type {TextInput as RNTextInput, ViewStyle} from 'react-native'
import type {TerminalColors} from '../../theme/terminal'
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
	colors?: TerminalColors
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
	colors = TERMINAL_COLORS,
}) => {
	const [isFocused, setIsFocused] = useState(false)

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: isFocused ? colors.surfaceActive : colors.surface,
					borderTopColor: isFocused ? colors.borderActive : colors.border,
				},
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
					color={colors.mutedText}
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
					color={colors.mutedText}
				/>
			</TouchableOpacity>

			{/* Prompt glyph — accent when focused, muted when idle */}
			<TerminalPrompt variant={isFocused ? 'default' : 'muted'} />

			{/* Command text field */}
			<TextInput
				ref={inputRef}
				style={[styles.input, {color: colors.commandText}]}
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
				placeholderTextColor={colors.subtleText}
				placeholder="type command…"
				selectionColor={colors.accent}
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
					color={isFocused ? colors.accent : colors.mutedText}
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
	navBtn: {
		paddingHorizontal: 6,
		paddingVertical: 4,
	},
	input: {
		flex: 1,
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
