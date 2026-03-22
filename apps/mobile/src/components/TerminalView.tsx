import React, {useEffect, useRef} from 'react'
import {StyleSheet, View} from 'react-native'
import {WebView} from 'react-native-webview'

interface TerminalViewProps {
	onData: (data: string) => void
	output: string
}

export const TerminalView: React.FC<TerminalViewProps> = ({onData, output}) => {
	const webViewRef = useRef<WebView>(null)

	// When output changes, send to WebView
	useEffect(() => {
		if (output) {
			webViewRef.current?.postMessage(
				JSON.stringify({type: 'data', content: output}),
			)
		}
	}, [output])

	const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
    <style>
        body { margin: 0; background: #000; overflow: hidden; }
        #terminal { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="terminal"></div>
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
    <script>
        const term = new window.Terminal({
            cursorBlink: true,
            theme: { background: '#000' },
            fontFamily: 'monospace',
            fontSize: 14
        });
        term.open(document.getElementById('terminal'));
        
        // Disable touch scrolling to let xterm handle it
        document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'data') {
                    term.write(data.content);
                }
            } catch (e) {}
        });

        term.onData((data) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'data', content: data }));
        });

        // Focus terminal on start
        term.focus();
    </script>
</body>
</html>
  `

	return (
		<View style={styles.container}>
			<WebView
				ref={webViewRef}
				originWhitelist={['*']}
				source={{html}}
				style={styles.webview}
				onMessage={event => {
					try {
						const data = JSON.parse(event.nativeEvent.data)
						if (data.type === 'data') {
							onData(data.content)
						}
					} catch (err) {
						console.error('WebView onMessage error:', err)
					}
				}}
				keyboardDisplayRequiresUserAction={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	webview: {
		flex: 1,
		backgroundColor: '#000',
	},
})
