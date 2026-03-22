import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	ScrollView,
	TouchableWithoutFeedback,
	Platform,
	UIManager,
} from 'react-native'
import type {TouchableOpacityProps, ViewProps} from 'react-native'
import React, {createContext, useContext, useState} from 'react'
import * as ZeegoMenu from 'zeego/dropdown-menu'

// Check if native MenuView is available (not available in Expo Go)
const hasNativeMenu =
	Platform.OS === 'ios' ||
	(Platform.OS === 'android' &&
		UIManager.getViewManagerConfig('MenuView') != null)

const MenuContext = createContext<{
	visible: boolean
	setVisible: (v: boolean) => void
} | null>(null)

// JS Fallback Components
const JSRoot = ({children}: {children: React.ReactNode}) => {
	const [visible, setVisible] = useState(false)
	return (
		<MenuContext.Provider value={{visible, setVisible}}>
			<View>{children}</View>
		</MenuContext.Provider>
	)
}

const JSTrigger = ({
	children,
	asChild: _asChild,
	...props
}: TouchableOpacityProps & {asChild?: boolean}) => {
	const ctx = useContext(MenuContext)
	return (
		<TouchableOpacity onPress={() => ctx?.setVisible(true)} {...props}>
			{children}
		</TouchableOpacity>
	)
}

const JSContent = ({children}: {children: React.ReactNode}) => {
	const ctx = useContext(MenuContext)
	return (
		<Modal
			transparent
			visible={ctx?.visible}
			animationType="fade"
			onRequestClose={() => ctx?.setVisible(false)}
		>
			<TouchableWithoutFeedback onPress={() => ctx?.setVisible(false)}>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<View
						style={{
							backgroundColor: '#18181b',
							borderRadius: 8,
							width: '80%',
							maxHeight: '70%',
							overflow: 'hidden',
							borderWidth: 1,
							borderColor: '#27272a',
						}}
					>
						<ScrollView>{children}</ScrollView>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	)
}

const JSItem = ({
	children,
	onSelect,
}: {
	children: React.ReactNode
	onSelect?: () => void
}) => {
	const ctx = useContext(MenuContext)
	return (
		<TouchableOpacity
			style={{padding: 16, borderBottomWidth: 1, borderBottomColor: '#27272a'}}
			onPress={() => {
				onSelect?.()
				ctx?.setVisible(false)
			}}
		>
			{children}
		</TouchableOpacity>
	)
}

const JSItemTitle = ({children}: {children: React.ReactNode}) => (
	<Text style={{color: 'white', fontSize: 16}}>{children}</Text>
)
const JSLabel = ({children}: {children: React.ReactNode}) => (
	<Text
		style={{color: '#71717a', fontSize: 12, padding: 8, fontWeight: 'bold'}}
	>
		{children}
	</Text>
)
const JSSeparator = () => (
	<View style={{height: 1, backgroundColor: '#27272a'}} />
)

type JSItemIconProps = ViewProps & {
	ios?: unknown
	androidIconName?: string
	children?: React.ReactNode
}

const JSItemIcon = ({
	children,
	ios: _ios,
	androidIconName: _androidIconName,
	...props
}: JSItemIconProps) => {
	return (
		<View style={{marginRight: 8}} {...props}>
			{children}
		</View>
	)
}

// Export Native if available, otherwise JS Fallback
export const Root = hasNativeMenu ? ZeegoMenu.Root : JSRoot
export const Trigger = hasNativeMenu ? ZeegoMenu.Trigger : JSTrigger
export const Content = hasNativeMenu ? ZeegoMenu.Content : JSContent
export const Item = hasNativeMenu ? ZeegoMenu.Item : JSItem
export const ItemTitle = hasNativeMenu ? ZeegoMenu.ItemTitle : JSItemTitle
export const Label = hasNativeMenu ? ZeegoMenu.Label : JSLabel
export const Separator = hasNativeMenu ? ZeegoMenu.Separator : JSSeparator

// Simplified mocks for other components

export const Group = hasNativeMenu
	? ZeegoMenu.Group
	: ({children}: {children: React.ReactNode}) => <View>{children}</View>

export const Sub = hasNativeMenu
	? ZeegoMenu.Sub
	: ({children}: {children: React.ReactNode}) => <View>{children}</View>

export const SubContent = hasNativeMenu
	? ZeegoMenu.SubContent
	: ({children}: {children: React.ReactNode}) => <View>{children}</View>
export const SubTrigger = hasNativeMenu ? ZeegoMenu.SubTrigger : JSItem
export const CheckboxItem = hasNativeMenu ? ZeegoMenu.CheckboxItem : JSItem
export const ItemIcon = hasNativeMenu ? ZeegoMenu.ItemIcon : JSItemIcon

export const ItemSubtitle = hasNativeMenu
	? ZeegoMenu.ItemSubtitle
	: ({children}: {children: React.ReactNode}) => (
			<Text style={{color: '#71717a', fontSize: 12}}>{children}</Text>
		)
export const ItemImage = ZeegoMenu.ItemImage
export const ItemIndicator = ZeegoMenu.ItemIndicator
export const Arrow = ZeegoMenu.Arrow
