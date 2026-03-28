import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type {TerminalColors} from '../theme/terminal'
import {TERMINAL_COLORS} from '../theme/terminal'
import {scaleText} from 'react-native-text'
import * as Clipboard from 'expo-clipboard'
import React from 'react'

const textScaleStyle = scaleText({fontSize: 20})

interface ToolbarButtonProps {
	label: string
	icon?: React.ReactNode
	onPress: () => void
	primary?: boolean
	accentColor: string
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
	label,
	icon,
	onPress,
	primary,
	accentColor,
}) => (
	<TouchableOpacity
		onPress={onPress}
		style={[
			styles.toolbarBtn,
			primary ? {backgroundColor: accentColor} : styles.toolbarBtnDefault,
		]}
		accessibilityRole="button"
		accessibilityLabel={label}
	>
		{icon ?? (
			<Text style={[textScaleStyle, styles.toolbarBtnText]}>{label}</Text>
		)}
	</TouchableOpacity>
)

interface TerminalToolbarProps {
	onSend: (data: string) => void
	colors?: TerminalColors
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
	onSend,
	colors = TERMINAL_COLORS,
}) => {
	const pasteFromClipboard = async () => {
		try {
			const text = await Clipboard.getStringAsync()
			if (text) {
				onSend(text)
			}
		} catch {
			// Clipboard access may be denied on iOS/Android
		}
	}

	const ICON_COLOR = '#ffffff'
	const ICON_SIZE = 17

	// Arrow keys use MaterialCommunityIcons; other keys keep text labels.
	const buttons = [
		{label: 'Tab', code: '\t', icon: null},
		{label: 'Esc', code: '\x1b', icon: null},
		{
			label: 'Up',
			code: '\x1b[A',
			icon: (
				<MaterialCommunityIcons
					name="arrow-up"
					size={ICON_SIZE}
					color={ICON_COLOR}
				/>
			),
		},
		{
			label: 'Down',
			code: '\x1b[B',
			icon: (
				<MaterialCommunityIcons
					name="arrow-down"
					size={ICON_SIZE}
					color={ICON_COLOR}
				/>
			),
		},
		{
			label: 'Left',
			code: '\x1b[D',
			icon: (
				<MaterialCommunityIcons
					name="arrow-left"
					size={ICON_SIZE}
					color={ICON_COLOR}
				/>
			),
		},
		{
			label: 'Right',
			code: '\x1b[C',
			icon: (
				<MaterialCommunityIcons
					name="arrow-right"
					size={ICON_SIZE}
					color={ICON_COLOR}
				/>
			),
		},
		{label: 'Home', code: '\x1b[H', icon: null},
		{label: 'End', code: '\x1b[F', icon: null},
		{label: '^C', code: '\x03', icon: null},
		{label: '^D', code: '\x04', icon: null},
		{label: '^Z', code: '\x1a', icon: null},
	]

	return (
		<View
			style={[
				styles.toolbar,
				{
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
				},
			]}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.scroll}
			>
				<ToolbarButton
					label="Paste"
					onPress={pasteFromClipboard}
					primary
					accentColor={colors.accent}
				/>
				{buttons.map(btn => (
					<ToolbarButton
						key={btn.label}
						label={btn.label}
						icon={btn.icon ?? undefined}
						onPress={() => btn.code && onSend(btn.code)}
						accentColor={colors.accent}
					/>
				))}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	toolbar: {
		paddingVertical: 4,
		borderTopWidth: 1,
	},
	scroll: {
		paddingHorizontal: 4,
	},
	toolbarBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
		marginHorizontal: 4,
	},
	toolbarBtnDefault: {
		backgroundColor: '#3f3f46',
	},
	toolbarBtnText: {
		fontWeight: '500',
		color: '#ffffff',
	},
})
