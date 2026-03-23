import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {ScrollView, Text, TouchableOpacity, View} from 'react-native'
import {scaleText} from 'react-native-text'
import * as Clipboard from 'expo-clipboard'
import React from 'react'

const textScaleStyle = scaleText({fontSize: 20})

interface ToolbarButtonProps {
	label: string
	icon?: React.ReactNode
	onPress: () => void
	primary?: boolean
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
	label,
	icon,
	onPress,
	primary,
}) => (
	<TouchableOpacity
		onPress={onPress}
		className={`flex-row items-center justify-center px-3 py-2 rounded-md mx-1 ${primary ? 'bg-indigo-600' : 'bg-zinc-800'}`}
		accessibilityRole="button"
		accessibilityLabel={label}
	>
		{icon ?? (
			<Text style={textScaleStyle} className="font-medium text-white">
				{label}
			</Text>
		)}
	</TouchableOpacity>
)

interface TerminalToolbarProps {
	onSend: (data: string) => void
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({onSend}) => {
	const pasteFromClipboard = async () => {
		const text = await Clipboard.getStringAsync()
		if (text) {
			onSend(text)
		}
	}

	const ICON_COLOR = '#ffffff'
	const ICON_SIZE = 17

	// Arrow keys use MaterialCommunityIcons; other keys keep text labels.
	// All `code` values are unchanged to preserve existing SSH key-code mapping.
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
	]

	return (
		<View className="py-1 border-t bg-zinc-900 border-zinc-800">
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="px-1"
			>
				<ToolbarButton label="Paste" onPress={pasteFromClipboard} primary />
				{buttons.map(btn => (
					<ToolbarButton
						key={btn.label}
						label={btn.label}
						icon={btn.icon ?? undefined}
						onPress={() => btn.code && onSend(btn.code)}
					/>
				))}
			</ScrollView>
		</View>
	)
}
