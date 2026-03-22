import React, {useEffect, useRef} from 'react'
import {scaleText} from 'react-native-text'
import {FitAddon} from '@xterm/addon-fit'
import {Terminal} from '@xterm/xterm'
import {View} from 'react-native'

// const { fontSize, lineHeight } = useScaleText({ fontSize: 18 });
const textScaleStyle = scaleText({fontSize: 20})

interface TerminalViewProps {
	onData: (data: string) => void
	output: string
}

export const TerminalView: React.FC<TerminalViewProps> = ({onData, output}) => {
	const terminalRef = useRef<HTMLDivElement>(null)
	const term = useRef<Terminal | null>(null)
	const fitAddon = useRef<FitAddon | null>(null)

	useEffect(() => {
		if (!terminalRef.current) return

		// Load xterm CSS dynamically
		if (!document.getElementById('xterm-style')) {
			const link = document.createElement('link')
			link.id = 'xterm-style'
			link.rel = 'stylesheet'
			link.href = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css'
			document.head.appendChild(link)
		}

		term.current = new Terminal({
			cursorBlink: true,
			theme: {background: '#000'},
			fontFamily: 'monospace',
			fontSize: textScaleStyle.fontSize,
		})

		fitAddon.current = new FitAddon()
		term.current.loadAddon(fitAddon.current)
		term.current.open(terminalRef.current)

		// Small delay to ensure container is ready
		setTimeout(() => {
			fitAddon.current?.fit()
		}, 100)

		const disposable = term.current.onData(data => {
			onData(data)
		})

		const resizeHandler = () => {
			fitAddon.current?.fit()
		}
		window.addEventListener('resize', resizeHandler)

		return () => {
			disposable.dispose()
			term.current?.dispose()
			window.removeEventListener('resize', resizeHandler)
		}
	}, [])

	useEffect(() => {
		if (term.current && output) {
			term.current.write(output)
		}
	}, [output])

	return (
		<View style={{flex: 1, backgroundColor: '#000'}}>
			<div
				ref={terminalRef}
				style={{width: '100%', height: '100%', backgroundColor: '#000'}}
			/>
		</View>
	)
}
