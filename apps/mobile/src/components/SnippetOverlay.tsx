import {
	FlatList,
	Modal,
	SafeAreaView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import {useSnippetStore} from '../store/useSnippetStore'
import {scaleText} from 'react-native-text'
import type {Snippet} from '@shelly/shared'
import React from 'react'

// const { fontSize, lineHeight } = useScaleText({ fontSize: 18 });
const textScaleStyle = scaleText({fontSize: 20})

interface SnippetOverlayProps {
	isVisible: boolean
	onClose: () => void
	onSelect: (command: string) => void
}

export const SnippetOverlay: React.FC<SnippetOverlayProps> = ({
	isVisible,
	onClose,
	onSelect,
}) => {
	const {snippets} = useSnippetStore()

	const handleSelect = (snippet: Snippet) => {
		onSelect(snippet.command + '\r') // Append enter
		onClose()
	}

	return (
		<Modal visible={isVisible} animationType="slide" transparent>
			<View className="justify-end flex-1 bg-black/50">
				<SafeAreaView className="bg-zinc-900 rounded-t-2xl max-h-[70%]">
					<View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
						<Text style={textScaleStyle} className="font-bold text-white">
							Snippets
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Text
								style={textScaleStyle}
								className="font-medium text-indigo-400"
							>
								Close
							</Text>
						</TouchableOpacity>
					</View>

					<FlatList
						data={snippets}
						keyExtractor={item => item.id}
						renderItem={({item}) => (
							<TouchableOpacity
								onPress={() => handleSelect(item)}
								className="p-4 border-b border-zinc-800"
							>
								<Text style={textScaleStyle} className="font-medium text-white">
									{item.name}
								</Text>
								<Text
									style={textScaleStyle}
									className="mt-1 text-xs text-zinc-500"
									numberOfLines={1}
								>
									{item.command}
								</Text>
							</TouchableOpacity>
						)}
						ListEmptyComponent={
							<View className="items-center p-8">
								<Text style={textScaleStyle} className="text-zinc-500">
									No snippets found
								</Text>
							</View>
						}
					/>
				</SafeAreaView>
			</View>
		</Modal>
	)
}
