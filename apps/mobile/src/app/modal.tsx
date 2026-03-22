import {ScrollView, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'

export default function Modal() {
	return (
		<>
			<StatusBar style="light" />
			<View className="flex flex-1">
				<ScrollView contentInsetAdjustmentBehavior="automatic"></ScrollView>
			</View>
		</>
	)
}
