import {
	TERMINAL_COLORS,
	TERMINAL_FONT,
	TERMINAL_SPACING,
} from '../../theme/terminal'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import React, {useEffect, useRef} from 'react'
import type {ViewStyle} from 'react-native'

interface TerminalOutputProps {
	output: string
	style?: ViewStyle
}

/**
 * Scrollable area that renders processed SSH output as a single monospace
 * `Text` block.  Auto-scrolls to the bottom on each output change using
 * `requestAnimationFrame` to wait for the layout pass before measuring.
 */
export const TerminalOutput: React.FC<TerminalOutputProps> = ({
	output,
	style,
}) => {
	const scrollRef = useRef<ScrollView>(null)

	// Defer scrollToEnd by one animation frame so the layout has settled before
	// we try to measure the full scroll height.
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			scrollRef.current?.scrollToEnd({animated: false})
		})
		return () => cancelAnimationFrame(id)
	}, [output])

	return (
		<View style={[styles.wrapper, style]}>
			<ScrollView
				ref={scrollRef}
				style={styles.scroll}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				accessibilityLabel="Terminal output area"
			>
				<Text
					style={styles.text}
					selectable
					accessibilityRole="text"
					accessibilityLabel="SSH session output"
				>
					{output}
				</Text>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: TERMINAL_COLORS.background,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: TERMINAL_SPACING.outputPaddingH,
		paddingVertical: TERMINAL_SPACING.outputPaddingV,
		paddingBottom: 16,
	},
	text: {
		color: TERMINAL_COLORS.outputText,
		fontFamily: TERMINAL_FONT.family,
		fontSize: TERMINAL_FONT.size,
		lineHeight: TERMINAL_FONT.lineHeight,
	},
})
