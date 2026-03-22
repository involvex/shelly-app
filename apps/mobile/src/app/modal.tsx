import {Platform, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {ScrollView} from 'react-native'

import {useColorScheme} from '@/lib/useColorScheme'
import {Icon} from '@/components/Icon'

export default function Modal() {
	const {colors, colorScheme} = useColorScheme()
	return (
		<>
			<StatusBar
				style={
					Platform.OS === 'ios'
						? 'light'
						: colorScheme === 'dark'
							? 'light'
							: 'dark'
				}
			/>
			<View className="flex flex-1">
				<Icon name="doc.badge.plus" size={42} color={colors.grey} />
				<ScrollView contentInsetAdjustmentBehavior="automatic"></ScrollView>
			</View>
		</>
	)
}
