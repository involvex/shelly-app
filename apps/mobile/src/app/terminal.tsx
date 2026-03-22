import {
	SafeAreaView,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import {TerminalToolbar} from '../components/TerminalToolbar'
import {useDiscoveryStore} from '../store/useDiscoveryStore'
import {SnippetOverlay} from '../components/SnippetOverlay'
import {useSnippetStore} from '../store/useSnippetStore'
import {TerminalView} from '../components/TerminalView'
import {useSSHStore} from '../store/useSSHStore'
import {useEffect, useState} from 'react'

export default function TerminalScreen() {
	const {output, isConnecting, error, connect, sendData, service, disconnect} =
		useSSHStore()
	const {loadSnippets} = useSnippetStore()
	const {hosts, isScanning, startScan} = useDiscoveryStore()

	const [host, setHost] = useState('192.168.1.100')
	const [user, setUser] = useState('Administrator')
	const [password, setPassword] = useState('')
	const [isSnippetsVisible, setSnippetsVisible] = useState(false)

	useEffect(() => {
		loadSnippets()
		startScan()
	}, [])

	const isConnected = service.isConnected()

	const handleConnect = () => {
		connect({
			host,
			port: 22,
			user,
			auth: {type: 'password', value: password},
		})
	}

	if (!isConnected) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950 p-4">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						justifyContent: 'center',
						paddingVertical: 40,
					}}
				>
					<View className="items-center mb-6">
						<Text className="text-4xl">🐚</Text>
						<Text className="text-3xl font-bold text-white mt-2">Shelly</Text>
					</View>

					<View className="space-y-4">
						<View className="space-y-2">
							<Text className="text-zinc-400 text-sm">Host</Text>
							<TextInput
								value={host}
								onChangeText={setHost}
								placeholder="e.g. 192.168.1.100"
								placeholderTextColor="#555"
								className="bg-zinc-900 text-white p-3 rounded-md border border-zinc-800"
							/>
						</View>

						<View className="space-y-2">
							<Text className="text-zinc-400 text-sm">Username</Text>
							<TextInput
								value={user}
								onChangeText={setUser}
								placeholder="Administrator"
								placeholderTextColor="#555"
								className="bg-zinc-900 text-white p-3 rounded-md border border-zinc-800"
							/>
						</View>

						<View className="space-y-2">
							<Text className="text-zinc-400 text-sm">Password</Text>
							<TextInput
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								placeholder="********"
								placeholderTextColor="#555"
								className="bg-zinc-900 text-white p-3 rounded-md border border-zinc-800"
							/>
						</View>

						{error && <Text className="text-red-500 text-sm">{error}</Text>}

						<TouchableOpacity
							onPress={handleConnect}
							disabled={isConnecting}
							className={`p-4 rounded-md items-center ${isConnecting ? 'bg-zinc-700' : 'bg-indigo-600'}`}
						>
							<Text className="text-white font-bold text-lg">
								{isConnecting ? 'Connecting...' : 'Connect'}
							</Text>
						</TouchableOpacity>

						{/* Local Discovery */}
						<View className="mt-8">
							<View className="flex-row justify-between items-center mb-3">
								<Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs">
									Local Devices
								</Text>
								{isScanning && (
									<Text className="text-zinc-600 text-[10px] animate-pulse">
										Scanning...
									</Text>
								)}
							</View>
							{hosts.map(d => (
								<TouchableOpacity
									key={d.host}
									onPress={() => setHost(d.host)}
									className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50 mb-2 flex-row justify-between"
								>
									<Text className="text-zinc-200">{d.name}</Text>
									<Text className="text-zinc-500">{d.host}</Text>
								</TouchableOpacity>
							))}
							{!isScanning && hosts.length === 0 && (
								<Text className="text-zinc-600 text-xs italic">
									No devices found. Ensure host has SSH enabled.
								</Text>
							)}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView className="flex-1 bg-black">
			<View className="flex-row items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
				<Text className="text-zinc-400 font-medium text-xs">
					{user}@{host}
				</Text>
				<View className="flex-row gap-2">
					<TouchableOpacity
						onPress={() => setSnippetsVisible(true)}
						className="px-2 py-1 bg-zinc-800 rounded"
					>
						<Text className="text-white text-xs">Snippets</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => disconnect()}
						className="px-2 py-1 bg-red-900/50 rounded"
					>
						<Text className="text-red-400 text-xs">Exit</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View className="flex-1">
				<TerminalView output={output} onData={sendData} />
			</View>

			<TerminalToolbar onSend={sendData} />

			<SnippetOverlay
				isVisible={isSnippetsVisible}
				onClose={() => setSnippetsVisible(false)}
				onSelect={sendData}
			/>
		</SafeAreaView>
	)
}
