import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react'
import {TERMINAL_THEMES, TERMINAL_COLORS} from '../theme/terminal'
import {useCommandHistory} from '../hooks/useCommandHistory'
import {CommandInput, TerminalOutput} from './terminal'
import {useAppSettings} from '../store/useAppSettings'
import {StyleSheet, View} from 'react-native'
import type {TextInput} from 'react-native'

// Strip ANSI escape sequences so raw terminal codes don't appear as garbage.
const ANSI_RE =
	// oxlint-disable-next-line no-control-regex
	// eslint-disable-next-line no-control-regex
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
	fontSize?: number
	onProgress?: (state: {state: 0 | 1 | 2 | 3 | 4; value: number} | null) => void
	onSerialize?: (state: string) => void
	savedState?: string | null
}

/** Methods exposed to the parent screen via ref. */
export interface TerminalViewHandle {
	/** Returns the current text buffered in the command input. */
	getInputText: () => string
	/** Clears the command input buffer and keeps the keyboard open. */
	clearInput: () => void
}

/**
 * Native terminal view composing:
 *   TerminalOutput   — scrollable SSH output area (auto-scrolls)
 *   CommandInput     — keyboard-aware input row with history navigation
 *
 * NOTE: keyboard avoidance is handled by the parent screen's
 * `KeyboardAvoidingView` which also wraps `TerminalToolbar`.  Do NOT add a
 * nested KAV here — nesting two KAVs causes double-offset on iOS.
 */
export const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(
	function TerminalView({onData, output}, ref) {
		const inputRef = useRef<TextInput>(null)
		const [inputText, setInputText] = useState('')
		const {addCommand, navigateUp, navigateDown} = useCommandHistory()
		const {settings} = useAppSettings()

		const colors =
			TERMINAL_THEMES[settings.terminalTheme]?.colors ?? TERMINAL_COLORS
		const fontSize =
			typeof settings.fontSize === 'number' ? settings.fontSize : 13

		// Derive display text — no extra state, pure memoisation.
		const displayText = useMemo(() => processOutput(output ?? ''), [output])

		const sendInput = useCallback(() => {
			const text = inputText.trim()
			if (!text) return
			addCommand(text)
			// SSH shells expect CR (\r) as "Enter", not LF.
			onData(text + '\r')
			setInputText('')
			// Keep focus so the user can immediately type the next command.
			inputRef.current?.focus()
		}, [inputText, onData, addCommand])

		const handleNavigateUp = useCallback(() => {
			const cmd = navigateUp()
			if (cmd !== null) setInputText(cmd)
		}, [navigateUp])

		const handleNavigateDown = useCallback(() => {
			const cmd = navigateDown()
			if (cmd !== null) setInputText(cmd)
		}, [navigateDown])

		// Expose input buffer access to parent (used by TerminalToolbar for
		// prefix-flush: sends "git sta\t" instead of just "\t" when Tab is pressed).
		useImperativeHandle(
			ref,
			() => ({
				getInputText: () => inputText,
				clearInput: () => {
					setInputText('')
					inputRef.current?.focus()
				},
			}),
			[inputText],
		)

		return (
			<View style={[styles.container, {backgroundColor: colors.background}]}>
				<TerminalOutput
					output={displayText}
					colors={colors}
					fontSize={fontSize}
				/>
				<CommandInput
					value={inputText}
					onChangeText={setInputText}
					onSubmit={sendInput}
					onNavigateUp={handleNavigateUp}
					onNavigateDown={handleNavigateDown}
					inputRef={inputRef}
					colors={colors}
				/>
			</View>
		)
	},
)

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
