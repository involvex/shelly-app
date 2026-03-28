import type {
	IClipboardProvider,
	ClipboardSelectionType,
} from '@xterm/addon-clipboard'
import * as Clipboard from 'expo-clipboard'

export const expoClipboardProvider: IClipboardProvider = {
	async readText(_selection: ClipboardSelectionType): Promise<string> {
		return Clipboard.getStringAsync()
	},
	async writeText(
		_selection: ClipboardSelectionType,
		text: string,
	): Promise<void> {
		Clipboard.setStringAsync(text)
	},
}
