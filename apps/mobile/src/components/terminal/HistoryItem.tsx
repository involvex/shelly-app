import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {TERMINAL_COLORS, TERMINAL_FONT} from '../../theme/terminal'
import type {ViewStyle} from 'react-native'
import React from 'react'

interface HistoryItemProps {
	command: string
	/** If provided, a replay icon is shown and pressing it calls this handler. */
	onReplay?: (command: string) => void
	style?: ViewStyle
}

/**
 * A single entry in the command history list.  Shows the prompt glyph,
 * the command text (truncated to one line), and an optional replay button.
 */
export const HistoryItem: React.FC<HistoryItemProps> = ({
	command,
	onReplay,
	style,
}) => (
	<View style={[styles.row, style]}>
		<Text style={styles.prompt} selectable={false}>
			{'›'}
		</Text>
		<Text
			style={styles.command}
			selectable
			numberOfLines={1}
			ellipsizeMode="tail"
			accessibilityRole="text"
		>
			{command}
		</Text>
		{onReplay != null && (
			<TouchableOpacity
				onPress={() => onReplay(command)}
				style={styles.replayBtn}
				hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
				accessibilityLabel={`Re-run: ${command}`}
				accessibilityRole="button"
			>
				<MaterialCommunityIcons
					name="replay"
					size={14}
					color={TERMINAL_COLORS.mutedText}
				/>
			</TouchableOpacity>
		)}
	</View>
)

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 2,
	},
	prompt: {
		color: TERMINAL_COLORS.promptColor,
		fontFamily: TERMINAL_FONT.family,
		fontSize: TERMINAL_FONT.size + 2,
		fontWeight: '700',
		marginRight: 6,
	},
	command: {
		flex: 1,
		color: TERMINAL_COLORS.accentLight,
		fontFamily: TERMINAL_FONT.family,
		fontSize: TERMINAL_FONT.size,
		lineHeight: TERMINAL_FONT.lineHeight,
	},
	replayBtn: {
		paddingLeft: 8,
	},
})
