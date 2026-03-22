import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'

// Strip ANSI escape sequences so raw terminal codes don't appear as garbage.
const ANSI_RE =
	/\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b[()][A-Za-z0-9]|\x1b[=>]/g

function processOutput(raw: string): string {
	return raw
		.replace(ANSI_RE, '')
		.replace(/\r\n/g, '\n')
		.replace(/\r(?!\n)/g, '\n')
}

interface TerminalViewProps {
	onData: (data: string) => void
	output: string
}

export const TerminalView: React.FC<TerminalViewProps> = ({onData, output}) => {
	const scrollViewRef = useRef<ScrollView>(null)
	const inputRef = useRef<TextInput>(null)
	const [inputText, setInputText] = useState('')

	// Derive display text directly from output — no extra state, no update cascade.
	const displayText = useMemo(() => processOutput(output ?? ''), [output])

	// Scroll to bottom after the text grows. A single rAF delay lets the layout
	// finish before we call scrollToEnd.
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			scrollViewRef.current?.scrollToEnd({animated: false})
		})
		return () => cancelAnimationFrame(id)
	}, [displayText])

	const sendInput = useCallback(() => {
		const text = inputText.trim()
		if (!text) return
		// SSH shells expect CR (\r) as "Enter", not LF.
		onData(text + '\r')
		setInputText('')
		inputRef.current?.focus()
	}, [inputText, onData])

	return (
		<View style={styles.container}>
			{/* Output area */}
			<ScrollView
				ref={scrollViewRef}
				style={styles.outputScroll}
				contentContainerStyle={styles.outputContent}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.outputText} selectable>
					{displayText}
				</Text>
			</ScrollView>

			{/* Input row */}
			<View style={styles.inputRow}>
				<Text style={styles.promptSign}>›</Text>
				<TextInput
					ref={inputRef}
					style={styles.input}
					value={inputText}
					onChangeText={setInputText}
					onSubmitEditing={sendInput}
					returnKeyType="send"
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="off"
					blurOnSubmit={false}
					placeholderTextColor="#444"
					placeholder="type command…"
					selectionColor="#6366f1"
				/>
				<TouchableOpacity
					onPress={sendInput}
					style={styles.sendButton}
					activeOpacity={0.7}
				>
					<Text style={styles.sendIcon}>↵</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0d0d0d',
	},
	outputScroll: {
		flex: 1,
	},
	outputContent: {
		padding: 10,
		paddingBottom: 4,
	},
	outputText: {
		color: '#d4d4d4',
		fontFamily: 'monospace',
		fontSize: 13,
		lineHeight: 20,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#2a2a2a',
		backgroundColor: '#141414',
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	promptSign: {
		color: '#6366f1',
		fontSize: 18,
		fontWeight: 'bold',
		paddingRight: 6,
	},
	input: {
		flex: 1,
		color: '#e2e2e2',
		fontFamily: 'monospace',
		fontSize: 13,
		paddingVertical: 8,
	},
	sendButton: {
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	sendIcon: {
		color: '#6366f1',
		fontSize: 20,
		fontWeight: 'bold',
	},
})
