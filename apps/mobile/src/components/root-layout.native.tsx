import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native'
import {MoreMenu, PageMenu, SortMenu} from '@/components/menus'
import {useColorScheme, View} from 'react-native'
import * as AC from '@bacons/apple-colors'
import {useProject} from '@/data/project'
import {MaterialIcons} from './icons'
import {Stack} from 'expo-router'

export default function NativeRootLayout() {
	const {project} = useProject()
	const colorScheme = useColorScheme()
	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						title: project.title,
						headerTitleAlign: 'center',
						headerLargeTitle: true,

						headerShadowVisible: true,
						headerLargeTitleShadowVisible: false,
						headerLargeStyle: {
							backgroundColor: 'transparent',
						},
						headerTitleStyle: {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							color: AC.label as any,
						},
						headerBlurEffect: 'systemChromeMaterial',

						headerLeft() {
							return <PageMenu />
						},
						headerRight() {
							return (
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'flex-end',
										gap: 12,
									}}
								>
									<SortMenu>
										<MaterialIcons name="sort-ascending" size={24} />
									</SortMenu>
									<MoreMenu>
										<MaterialIcons name="information-variant" size={24} />
									</MoreMenu>
								</View>
							)
						},
					}}
				/>
				<Stack.Screen
					name="modal"
					options={{presentation: 'modal', title: 'Upgrade'}}
				/>
			</Stack>
		</ThemeProvider>
	)
}
