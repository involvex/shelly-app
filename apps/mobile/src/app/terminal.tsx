import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Platform,
} from 'react-native'
import {TerminalToolbar} from '../components/TerminalToolbar'
import {useDiscoveryStore} from '../store/useDiscoveryStore'
import {SafeAreaView} from 'react-native-safe-area-context'
import {SnippetOverlay} from '../components/SnippetOverlay'
import {useSnippetStore} from '../store/useSnippetStore'
import {TerminalView} from '../components/TerminalView'
import {useSSHProfiles} from '../store/useSSHProfiles'
import {useSSHSettings} from '../hooks/useSSHSettings'
// import { Icon } from '@/components/Icon';
import {useColorScheme} from '@/lib/useColorScheme'
import {useSSHStore} from '../store/useSSHStore'
import {scaleText} from 'react-native-text'
import {StatusBar} from 'expo-status-bar'
import {useEffect, useState} from 'react'

// const { fontSize, lineHeight } = useScaleText({ fontSize: 18 });
const textScaleStyle = scaleText({fontSize: 20})

export default function TerminalScreen() {
	const {output, isConnecting, error, connect, sendData, service, disconnect} =
		useSSHStore()
	const {loadSnippets} = useSnippetStore()
	const {hosts, isScanning, startScan} = useDiscoveryStore()
	const {settings, updateSetting, save, loaded} = useSSHSettings()
	const {
		profiles,
		loaded: profilesLoaded,
		load: loadProfiles,
		add: addProfile,
		remove: removeProfile,
		getPassword,
	} = useSSHProfiles()

	const [isSnippetsVisible, setSnippetsVisible] = useState(false)
	const [showSaveProfile, setShowSaveProfile] = useState(false)
	const [profileName, setProfileName] = useState('')

	const {colors, colorScheme} = useColorScheme()

	useEffect(() => {
		loadSnippets()
		startScan()
		loadProfiles()
	}, [])

	const isConnected = service.isConnected()

	const handleConnect = async () => {
		const port = parseInt(settings.port, 10) || 22
		await save(settings)
		connect({
			host: settings.host,
			port,
			user: settings.user,
			auth: {type: 'password', value: settings.password},
		})
	}

	const handleSelectProfile = async (id: string) => {
		const p = profiles.find(x => x.id === id)
		if (!p) return
		const pw = await getPassword(id)
		updateSetting('host', p.host)
		updateSetting('port', p.port)
		updateSetting('user', p.user)
		updateSetting('password', pw)
	}

	const handleSaveProfile = async () => {
		if (!profileName.trim()) return
		await addProfile(
			{
				name: profileName.trim(),
				host: settings.host,
				port: settings.port,
				user: settings.user,
			},
			settings.password,
		)
		setProfileName('')
		setShowSaveProfile(false)
	}

	const handleDeleteProfile = (id: string, name: string) => {
		Alert.alert('Delete profile', `Remove "${name}"?`, [
			{text: 'Cancel', style: 'cancel'},
			{
				text: 'Delete',
				style: 'destructive',
				onPress: () => removeProfile(id),
			},
		])
	}

	if (!isConnected) {
		return (
			<SafeAreaView
				className="flex-1 p-4"
				style={{backgroundColor: colors.background}}
			>
				<StatusBar
					style={
						Platform.OS === 'ios'
							? 'light'
							: colorScheme === 'dark'
								? 'light'
								: 'dark'
					}
				/>
				<ScrollView
					className="flex-1"
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{paddingVertical: 40}}
				>
					<View className="items-center mb-6">
						<Text style={textScaleStyle}>🐚</Text>
						<Text style={textScaleStyle}>Shelly</Text>
					</View>

					{/* Saved profiles */}
					{profilesLoaded && profiles.length > 0 && (
						<View className="mb-5">
							<Text
								className="mb-2 text-xs font-bold tracking-wider uppercase"
								style={[textScaleStyle, {color: colors.primary}]}
							>
								Saved Profiles
							</Text>
							{profiles.map(p => (
								<View
									key={p.id}
									className="flex-row items-center mb-2 overflow-hidden border rounded-md"
									style={{
										backgroundColor: colors.card,
										borderColor: colors.border,
									}}
								>
									<TouchableOpacity
										className="flex-1 p-3"
										onPress={() => handleSelectProfile(p.id)}
									>
										<Text
											className="font-medium"
											style={[textScaleStyle, {color: colors.text}]}
										>
											{p.name}
										</Text>
										<Text
											className="text-zinc-500 text-xs mt-0.5"
											style={textScaleStyle}
										>
											{p.user}@{p.host}:{p.port}
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										className="px-3 py-3"
										onPress={() => handleDeleteProfile(p.id, p.name)}
									>
										<Text
											className="text-lg text-zinc-600"
											style={textScaleStyle}
										>
											✕
										</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>
					)}

					<View className="space-y-4">
						{/* Host + Port row */}
						<View className="flex-row gap-2">
							<View className="flex-1 space-y-1">
								<Text className="text-sm text-zinc-400" style={textScaleStyle}>
									Host
								</Text>
								<TextInput
									value={settings.host}
									onChangeText={v => updateSetting('host', v)}
									placeholder="192.168.1.100"
									placeholderTextColor="#555"
									autoCapitalize="none"
									autoCorrect={false}
									className="p-3 text-white border rounded-md bg-zinc-900 border-zinc-800"
								/>
							</View>
							<View className="w-20 space-y-1">
								<Text className="text-sm text-zinc-400" style={textScaleStyle}>
									Port
								</Text>
								<TextInput
									value={settings.port}
									onChangeText={v => updateSetting('port', v)}
									placeholder="22"
									placeholderTextColor="#555"
									keyboardType="number-pad"
									className="p-3 text-white border rounded-md bg-zinc-900 border-zinc-800"
								/>
							</View>
						</View>

						<View className="space-y-1">
							<Text className="text-sm text-zinc-400" style={textScaleStyle}>
								Username
							</Text>
							<TextInput
								value={settings.user}
								onChangeText={v => updateSetting('user', v)}
								placeholder="Administrator"
								placeholderTextColor="#555"
								autoCapitalize="none"
								autoCorrect={false}
								className="p-3 text-white border rounded-md bg-zinc-900 border-zinc-800"
							/>
						</View>

						<View className="space-y-1">
							<Text className="text-sm text-zinc-400" style={textScaleStyle}>
								Password
							</Text>
							<TextInput
								value={settings.password}
								onChangeText={v => updateSetting('password', v)}
								secureTextEntry
								placeholder="••••••••"
								placeholderTextColor="#555"
								className="p-3 text-white border rounded-md bg-zinc-900 border-zinc-800"
							/>
						</View>

						{error && (
							<Text className="text-sm text-red-500" style={textScaleStyle}>
								{error}
							</Text>
						)}

						<TouchableOpacity
							onPress={handleConnect}
							disabled={isConnecting || !loaded}
							className={`p-4 rounded-md items-center ${isConnecting || !loaded ? 'bg-zinc-700' : 'bg-indigo-600'}`}
						>
							<Text
								className="text-lg font-bold text-white"
								style={textScaleStyle}
							>
								{isConnecting ? 'Connecting…' : 'Connect'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => setShowSaveProfile(true)}
							className="items-center p-3 border rounded-md border-zinc-700"
						>
							<Text className="text-sm text-zinc-400" style={textScaleStyle}>
								Save as Profile
							</Text>
						</TouchableOpacity>

						{/* Local Discovery */}
						<View className="mt-6">
							<View className="flex-row items-center justify-between mb-3">
								<Text
									className="text-xs font-bold tracking-wider uppercase text-zinc-400"
									style={textScaleStyle}
								>
									Local Devices
								</Text>
								{isScanning && (
									<Text
										className="text-zinc-600 text-[10px]"
										style={textScaleStyle}
									>
										Scanning…
									</Text>
								)}
							</View>
							{hosts.map(d => (
								<TouchableOpacity
									key={d.host}
									onPress={() => updateSetting('host', d.host)}
									className="flex-row justify-between p-3 mb-2 border rounded-md bg-zinc-900/50 border-zinc-800/50"
								>
									<Text className="text-zinc-200" style={textScaleStyle}>
										{d.name}
									</Text>
									<Text className="text-zinc-500" style={textScaleStyle}>
										{d.host}
									</Text>
								</TouchableOpacity>
							))}
							{!isScanning && hosts.length === 0 && (
								<Text
									className="text-xs italic text-zinc-600"
									style={textScaleStyle}
								>
									No devices found. Ensure SSH is enabled on the host.
								</Text>
							)}
						</View>
					</View>
				</ScrollView>

				{/* Save profile modal */}
				<Modal
					visible={showSaveProfile}
					transparent
					animationType="fade"
					onRequestClose={() => setShowSaveProfile(false)}
				>
					<View className="justify-center flex-1 px-6 bg-black/70">
						<View className="p-5 border bg-zinc-900 rounded-xl border-zinc-700">
							<Text
								className="mb-4 text-lg font-bold text-white"
								style={textScaleStyle}
							>
								Save Profile
							</Text>
							<Text
								className="mb-1 text-sm text-zinc-400"
								style={textScaleStyle}
							>
								Profile name
							</Text>
							<TextInput
								value={profileName}
								onChangeText={setProfileName}
								placeholder="e.g. Home Server"
								placeholderTextColor="#555"
								className="p-3 mb-4 text-white border rounded-md bg-zinc-800 border-zinc-700"
							/>
							<View className="flex-row gap-3">
								<TouchableOpacity
									onPress={() => setShowSaveProfile(false)}
									className="items-center flex-1 p-3 border rounded-md border-zinc-700"
								>
									<Text className="text-zinc-400" style={textScaleStyle}>
										Cancel
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleSaveProfile}
									className="items-center flex-1 p-3 bg-indigo-600 rounded-md"
								>
									<Text className="font-bold text-white" style={textScaleStyle}>
										Save
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView className="flex-1 bg-black">
			<View className="flex-row items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
				<Text
					className="text-xs font-medium text-zinc-400"
					style={textScaleStyle}
				>
					{settings.user}@{settings.host}
				</Text>
				<View className="flex-row gap-2">
					<TouchableOpacity
						onPress={() => setSnippetsVisible(true)}
						className="px-2 py-1 rounded bg-zinc-800"
					>
						<Text className="text-xs text-white" style={textScaleStyle}>
							Snippets
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => disconnect()}
						className="px-2 py-1 rounded bg-red-900/50"
					>
						<Text className="text-xs text-red-400" style={textScaleStyle}>
							Exit
						</Text>
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
