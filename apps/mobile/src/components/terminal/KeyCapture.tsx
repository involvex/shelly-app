import {
	TERMINAL_COLORS,
	TERMINAL_FONT,
	TERMINAL_SPACING,
} from '../../theme/terminal'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native'
import type {TextInput as RNTextInput, ViewStyle} from 'react-native'
import React, {useState, useRef, useCallback} from 'react'
import type {TerminalColors} from '../../theme/terminal'
import {TerminalPrompt} from './TerminalPrompt'

interface KeyCaptureProps {
	/** Send data to shell */
	onSend: (data: string) => void
	/** Add command to history when Enter is pressed */
	onAddCommand?: (command: string) => void
	/** Navigate to previous command in history */
	onNavigateUp: () => void
	/** Navigate to next command in history */
	onNavigateDown: () => void
	/** Current input value */
	value: string
	/** Called when input value changes */
	onChangeText: (text: string) => void
	inputRef?: React.RefObject<RNTextInput | null>
	style?: ViewStyle
	colors?: TerminalColors
}

/**
 * Hybrid terminal input component.
 *
 * - Normal typing: characters accumulate locally, sent on Enter (line-buffered)
 * - Tab key: sent immediately to trigger shell completions
 * - Arrow keys: handled by parent for history navigation
 *
 * Layout (left → right):
 *   [↑] [↓]  ›  [text input …]  [send]
 */
export const KeyCapture: React.FC<KeyCaptureProps> = ({
	onSend,
	onAddCommand,
	onNavigateUp,
	onNavigateDown,
	value,
	onChangeText,
	inputRef,
	style,
	colors = TERMINAL_COLORS,
}) => {
	const [isFocused, setIsFocused] = useState(false)
	const lastKeyWasTabRef = useRef(false)
	const submitInProgressRef = useRef(false)
	const valueBeforeSubmitRef = useRef('')

	/** Map special keys to escape sequences */
	const mapSpecialKey = useCallback((key: string): string | null => {
		switch (key) {
			case 'Enter':
				return '\r'
			case 'Tab':
				return '\t'
			case 'Backspace':
				return '\x7f'
			case 'Escape':
				return '\x1b'
			default:
				return null
		}
	}, [])

	/** Handle key press - only send special keys, not regular characters */
	const handleKeyPress = useCallback(
		(e: {nativeEvent: {key: string}}) => {
			const key = e.nativeEvent.key

			// Tab - send immediately for shell completion
			// Save current value so we can restore it after Tab
			if (key === 'Tab') {
				lastKeyWasTabRef.current = true
				valueBeforeSubmitRef.current = value
				onSend('\t')
				return
			}

			// Arrow keys - don't send to shell, let parent handle via onChangeText + callbacks
			if (key === 'ArrowUp' || key === 'ArrowDown') {
				return
			}

			// Other special keys (Enter, Backspace, Escape)
			const special = mapSpecialKey(key)
			if (special) {
				// For Enter, we'll handle in onSubmitEditing instead
				if (key !== 'Enter') {
					onSend(special)
				}
				return
			}

			// Normal printable characters - DON'T send immediately
			// They accumulate in the input field and get sent on Enter
		},
		[onSend, mapSpecialKey, value],
	)

	/** Handle text changes - detect Tab via input clearing as fallback */
	const handleChangeText = useCallback(
		(text: string) => {
			// If input went from non-empty to empty without explicit Enter press,
			// likely Tab was pressed (even if onKeyPress didn't fire on some devices)
			if (value && !text && !submitInProgressRef.current) {
				// Tab was likely pressed - send Tab to shell
				// Save current value before Tab
				const saved = value
				onSend('\t')
				// Restore the value after a short delay
				// Shell will respond with completions, input may change
				setTimeout(() => {
					// Only restore if user hasn't typed something new
					if (!submitInProgressRef.current) {
						onChangeText(saved)
					}
				}, 50)
				return
			}

			// Reset Tab flag when user types
			if (text !== value) {
				lastKeyWasTabRef.current = false
			}
			onChangeText(text)
		},
		[onChangeText, onSend, value],
	)

	/** Handle Enter - send full line-buffered command */
	const handleSubmit = useCallback(() => {
		// Prevent double-submit from multiple triggers
		if (submitInProgressRef.current) return
		submitInProgressRef.current = true
		setTimeout(() => {
			submitInProgressRef.current = false
		}, 100)

		// If last key was Tab, restore the input value before Tab
		// (Tab likely triggered completion and may have changed the input)
		if (lastKeyWasTabRef.current) {
			lastKeyWasTabRef.current = false
			const saved = valueBeforeSubmitRef.current
			if (saved) {
				onChangeText(saved)
			}
			return
		}

		// Don't send empty commands
		const text = value.trim()
		if (!text) return

		// Add to history
		if (onAddCommand) onAddCommand(text)

		// Send full command + Enter (line-buffered)
		onSend(text + '\r')
		onChangeText('')
	}, [value, onSend, onAddCommand, onChangeText])

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

			{/* Command text field - line-buffered input */}
			<TextInput
				ref={inputRef}
				style={[styles.input, {color: colors.commandText}]}
				value={value}
				onChangeText={handleChangeText}
				onKeyPress={handleKeyPress}
				onSubmitEditing={handleSubmit}
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
				accessibilityHint="Type a shell command and press Enter"
			/>

			{/* Send button */}
			<TouchableOpacity
				onPress={handleSubmit}
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
