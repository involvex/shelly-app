import {TERMINAL_COLORS, TERMINAL_FONT} from '../../theme/terminal'
import {StyleSheet, Text} from 'react-native'
import type {TextStyle} from 'react-native'
import React from 'react'

type Variant = 'default' | 'error' | 'muted'

interface TerminalPromptProps {
	variant?: Variant
	style?: TextStyle
}

const GLYPH_COLORS: Record<Variant, string> = {
	default: TERMINAL_COLORS.promptColor,
	error: TERMINAL_COLORS.errorText,
	muted: TERMINAL_COLORS.mutedText,
}

/**
 * The terminal prompt glyph (`›`) shown to the left of every command input
 * or history entry.  Colour changes with the `variant` prop to communicate
 * connection state (default = ready, error = failed, muted = history).
 */
export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
	variant = 'default',
	style,
}) => (
	<Text
		style={[styles.glyph, {color: GLYPH_COLORS[variant]}, style]}
		accessibilityLabel="Command prompt indicator"
		accessibilityRole="text"
		selectable={false}
	>
		{'›'}
	</Text>
)

const styles = StyleSheet.create({
	glyph: {
		fontFamily: TERMINAL_FONT.family,
		fontSize: TERMINAL_FONT.size + 3,
		fontWeight: '700',
		lineHeight: TERMINAL_FONT.lineHeight,
		marginRight: 6,
	},
})
