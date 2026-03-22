import {ScrollView, Text, TouchableOpacity, View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import React from 'react'

interface ToolbarButtonProps {
	label: string
	onPress: () => void
	primary?: boolean
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
	label,
	onPress,
	primary,
}) => (
	<TouchableOpacity
		onPress={onPress}
		className={`px-3 py-2 rounded-md mx-1 ${primary ? 'bg-indigo-600' : 'bg-zinc-800'}`}
	>
		<Text className="text-white font-medium text-sm">{label}</Text>
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

	const buttons = [
		{label: 'Tab', code: '\t'},
		{label: 'Esc', code: '\x1b'},
		{label: 'Ctrl', code: ''}, // TBD logic for Ctrl+
		{label: '↑', code: '\x1b[A'},
		{label: '↓', code: '\x1b[B'},
		{label: '←', code: '\x1b[D'},
		{label: '→', code: '\x1b[C'},
		{label: 'Home', code: '\x1b[H'},
		{label: 'End', code: '\x1b[F'},
	]

	return (
		<View className="bg-zinc-900 border-t border-zinc-800 py-1">
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
						onPress={() => btn.code && onSend(btn.code)}
					/>
				))}
			</ScrollView>
		</View>
	)
}
