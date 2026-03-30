// Polyfill 'self' and other browser globals before xterm.js loads — Metro does
// not define them and xterm references them at module evaluation time.
import '@/lib/polyfills'

import React, {
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react'
import {ProgressAddon, type IProgressState} from '@xterm/addon-progress'
import {expoClipboardProvider} from '@/lib/xterm-clipboard-provider'
import {createLinkHandler} from '@/lib/xterm-link-handler'
import {Unicode11Addon} from '@xterm/addon-unicode11'
import {SerializeAddon} from '@xterm/addon-serialize'
import {ClipboardAddon} from '@xterm/addon-clipboard'
import {WebLinksAddon} from '@xterm/addon-web-links'
import type {TerminalColors} from '@/theme/terminal'
import {Terminal, type ITheme} from '@xterm/xterm'
import {SearchAddon} from '@xterm/addon-search'
import {SearchBar} from './terminal/SearchBar'
import {FitAddon} from '@xterm/addon-fit'
import {View} from 'react-native'

interface TerminalViewProps {
	onData: (data: string) => void
	output: string
	colors?: TerminalColors
	fontSize?: number
	onProgress?: (state: IProgressState | null) => void
	onSerialize?: (state: string) => void
	savedState?: string | null
}

export interface TerminalViewHandle {
	serialize: () => string
	deserialize: (state: string) => void
	focus: () => void
	/** Web xterm manages its own input — always returns empty string. */
	getInputText: () => string
	/** Web xterm manages its own input — no-op. */
	clearInput: () => void
}

function toXtermTheme(colors?: TerminalColors): ITheme | undefined {
	if (!colors) return undefined
	return {
		background: colors.background,
		foreground: colors.outputText,
		cursor: colors.accent,
		cursorAccent: colors.background,
		selectionBackground: colors.accentMuted + '40',
		selectionForeground: colors.outputText,
		black: '#000000',
		red: colors.errorText,
		green: colors.successText,
		yellow: colors.warningText,
		blue: colors.accent,
		magenta: colors.accentMuted,
		cyan: colors.accentLight,
		white: colors.outputText,
		brightBlack: colors.mutedText,
		brightRed: colors.errorText,
		brightGreen: colors.successText,
		brightYellow: colors.warningText,
		brightBlue: colors.accentLight,
		brightMagenta: colors.accentMuted,
		brightCyan: colors.accentLight,
		brightWhite: colors.commandText,
	}
}

export const TerminalView = React.forwardRef<
	TerminalViewHandle,
	TerminalViewProps
>(function TerminalView(
	{onData, output, colors, fontSize = 13, onProgress, onSerialize, savedState},
	ref,
) {
	const terminalRef = useRef<HTMLDivElement>(null)
	const term = useRef<Terminal | null>(null)
	const fitAddon = useRef<FitAddon | null>(null)
	const searchAddon = useRef<SearchAddon | null>(null)
	const serializeAddon = useRef<SerializeAddon | null>(null)
	const [searchOpen, setSearchOpen] = useState(false)

	useImperativeHandle(
		ref,
		() => ({
			serialize: () => serializeAddon.current?.serialize() ?? '',
			deserialize: (state: string) => {
				term.current?.clear()
				term.current?.write(state)
			},
			focus: () => term.current?.focus(),
			getInputText: () => '',
			clearInput: () => {},
		}),
		[],
	)

	// Initialize terminal and all addons
	useEffect(() => {
		if (!terminalRef.current) return

		const xtermTheme = toXtermTheme(colors)

		const terminal = new Terminal({
			cursorBlink: true,
			cursorStyle: 'block',
			fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
			fontSize,
			lineHeight: 1.2,
			theme: xtermTheme ?? {background: '#0d0d0d'},
			allowProposedApi: true,
			scrollback: 5000,
			minimumContrastRatio: 4.5,
		})

		// Load addons in order
		const fit = new FitAddon()
		terminal.loadAddon(fit)
		fitAddon.current = fit

		const unicode11 = new Unicode11Addon()
		terminal.loadAddon(unicode11)

		const webLinks = new WebLinksAddon(createLinkHandler())
		terminal.loadAddon(webLinks)

		const search = new SearchAddon()
		terminal.loadAddon(search)
		searchAddon.current = search

		const clipboard = new ClipboardAddon(undefined, expoClipboardProvider)
		terminal.loadAddon(clipboard)

		const progress = new ProgressAddon()
		terminal.loadAddon(progress)
		if (onProgress) {
			progress.onChange(state => onProgress(state))
		}

		const serializer = new SerializeAddon()
		terminal.loadAddon(serializer)
		serializeAddon.current = serializer

		terminal.open(terminalRef.current)

		// Restore saved state or write initial output
		if (savedState) {
			terminal.write(savedState)
		} else if (output) {
			terminal.write(output)
		}

		// Fit after opening with a short delay for DOM readiness
		requestAnimationFrame(() => {
			fit.fit()
		})

		// Data callback
		const dataDisposable = terminal.onData(data => {
			onData(data)
		})

		// Keyboard shortcut for search
		const keyDisposable = terminal.onKey(({domEvent}) => {
			if ((domEvent.ctrlKey || domEvent.metaKey) && domEvent.key === 'f') {
				domEvent.preventDefault()
				setSearchOpen(prev => !prev)
			}
		})

		// Resize observer
		const resizeObserver = new ResizeObserver(() => {
			fit.fit()
		})
		if (terminalRef.current) {
			resizeObserver.observe(terminalRef.current)
		}

		term.current = terminal

		return () => {
			dataDisposable.dispose()
			keyDisposable.dispose()
			resizeObserver.disconnect()
			terminal.dispose()
			term.current = null
			fitAddon.current = null
			searchAddon.current = null
			serializeAddon.current = null
		}
	}, [])

	// React to output changes (append new data)
	const prevOutputRef = useRef<string>(output ?? '')
	useEffect(() => {
		if (!term.current) return
		const prev = prevOutputRef.current
		if (output && output.length > prev.length && output.startsWith(prev)) {
			term.current.write(output.slice(prev.length))
		} else if (output && output !== prev) {
			term.current.write(output)
		}
		prevOutputRef.current = output
	}, [output])

	// React to theme changes
	useEffect(() => {
		if (!term.current) return
		const xtermTheme = toXtermTheme(colors)
		if (xtermTheme) {
			term.current.options.theme = xtermTheme
		}
	}, [colors])

	// React to font size changes
	useEffect(() => {
		if (!term.current) return
		term.current.options.fontSize = fontSize
		requestAnimationFrame(() => {
			fitAddon.current?.fit()
		})
	}, [fontSize])

	// Persist terminal state on disconnect
	useEffect(() => {
		return () => {
			if (onSerialize && serializeAddon.current) {
				try {
					const state = serializeAddon.current.serialize()
					onSerialize(state)
				} catch {
					// Serialization may fail if terminal is already disposed
				}
			}
		}
	}, [onSerialize])

	const handleSearchClose = useCallback(() => {
		setSearchOpen(false)
		searchAddon.current?.clearDecorations()
		term.current?.focus()
	}, [])

	return (
		<View style={{flex: 1, backgroundColor: colors?.background ?? '#0d0d0d'}}>
			<div
				ref={terminalRef}
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: colors?.background ?? '#0d0d0d',
					position: 'relative',
				}}
			>
				{searchOpen && (
					<SearchBar
						searchAddon={searchAddon.current}
						onClose={handleSearchClose}
						accentColor={colors?.accent}
					/>
				)}
			</div>
		</View>
	)
})
