import {
	FlatList,
	Modal,
	SafeAreaView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import {useSnippetStore} from '../store/useSnippetStore'
import type {Snippet} from '@shelly/shared'
import React from 'react'

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
			<View className="flex-1 justify-end bg-black/50">
				<SafeAreaView className="bg-zinc-900 rounded-t-2xl max-h-[70%]">
					<View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
						<Text className="text-xl font-bold text-white">Snippets</Text>
						<TouchableOpacity onPress={onClose}>
							<Text className="text-indigo-400 font-medium">Close</Text>
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
								<Text className="text-white font-medium">{item.name}</Text>
								<Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
									{item.command}
								</Text>
							</TouchableOpacity>
						)}
						ListEmptyComponent={
							<View className="p-8 items-center">
								<Text className="text-zinc-500">No snippets found</Text>
							</View>
						}
					/>
				</SafeAreaView>
			</View>
		</Modal>
	)
}
