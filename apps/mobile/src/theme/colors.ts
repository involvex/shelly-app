import {Platform} from 'react-native'

const IOS_SYSTEM_COLORS = {
	white: 'rgb(255, 255, 255)',
	black: 'rgb(0, 0, 0)',
	light: {
		grey6: 'rgb(248, 248, 248)',
		border: 'rgb(238, 238, 237)',
		grey5: 'rgb(238, 238, 237)',
		grey4: 'rgb(227, 228, 227)',
		grey3: 'rgb(212, 214, 211)',
		grey2: 'rgb(181, 184, 179)',
		grey: 'rgb(160, 165, 158)',
		background: 'rgb(246, 248, 245)',
		secondary: 'rgb(162, 167, 160)',
		foreground: 'rgb(4, 5, 4)',
		root: 'rgb(246, 248, 245)',
		card: 'rgb(246, 248, 245)',
		destructive: 'rgb(255, 56, 43)',
		primary: 'rgb(61, 132, 23)',
		text: 'rgb(4, 5, 4)',
	},
	dark: {
		grey6: 'rgb(29, 30, 28)',
		grey5: 'rgb(48, 50, 47)',
		grey4: 'rgb(61, 63, 59)',
		grey3: 'rgb(81, 85, 79)',
		grey2: 'rgb(124, 129, 121)',
		grey: 'rgb(162, 167, 160)',
		background: 'rgb(2, 4, 1)',
		foreground: 'rgb(249, 254, 247)',
		secondary: 'rgb(162, 167, 160)',
		root: 'rgb(2, 4, 1)',
		card: 'rgb(2, 4, 1)',
		destructive: 'rgb(254, 67, 54)',
		primary: 'rgb(128, 224, 77)',
		text: 'rgb(4, 5, 4)',
		border: 'rgb(48, 50, 47)',
	},
} as const

const ANDROID_COLORS = {
	white: 'rgb(255, 255, 255)',
	black: 'rgb(0, 0, 0)',
	light: {
		grey6: 'rgb(249, 249, 249)',
		grey5: 'rgb(239, 239, 239)',
		grey4: 'rgb(228, 229, 228)',
		grey3: 'rgb(213, 214, 213)',
		grey2: 'rgb(182, 184, 182)',
		grey: 'rgb(161, 164, 161)',
		background: 'rgb(248, 249, 248)',
		foreground: 'rgb(3, 3, 3)',
		root: 'rgb(248, 249, 248)',
		secondary: 'rgb(162, 167, 160)',
		card: 'rgb(248, 249, 248)',
		destructive: 'rgb(186, 26, 26)',
		primary: 'rgb(120, 174, 117)',
		text: 'rgb(4, 5, 4)',
		border: 'rgb(239, 239, 239)',
	},
	dark: {
		grey6: 'rgb(28, 28, 28)',
		grey5: 'rgb(46, 47, 46)',
		grey4: 'rgb(59, 60, 59)',
		grey3: 'rgb(79, 81, 79)',
		grey2: 'rgb(122, 125, 122)',
		grey: 'rgb(160, 163, 160)',
		background: 'rgb(1, 2, 1)',
		foreground: 'rgb(251, 253, 251)',
		root: 'rgb(1, 2, 1)',
		card: 'rgb(1, 2, 1)',
		destructive: 'rgb(147, 0, 10)',
		primary: 'rgb(120, 174, 117)',
		secondary: 'rgb(162, 167, 160)',
		text: 'rgb(4, 5, 4)',
		border: 'rgb(48, 50, 47)',
	},
} as const

const WEB_COLORS = {
	white: 'rgb(255, 255, 255)',
	black: 'rgb(0, 0, 0)',
	light: {
		grey6: 'rgb(249, 249, 249)',
		grey5: 'rgb(239, 239, 239)',
		grey4: 'rgb(228, 229, 228)',
		grey3: 'rgb(213, 214, 213)',
		grey2: 'rgb(182, 184, 182)',
		grey: 'rgb(161, 164, 161)',
		background: 'rgb(248, 249, 248)',
		foreground: 'rgb(3, 3, 3)',
		root: 'rgb(248, 249, 248)',
		secondary: 'rgb(162, 167, 160)',
		card: 'rgb(248, 249, 248)',
		destructive: 'rgb(186, 26, 26)',
		primary: 'rgb(120, 174, 117)',
		text: 'rgb(4, 5, 4)',
		border: 'rgb(239, 239, 239)',
	},
	dark: {
		grey6: 'rgb(28, 28, 28)',
		grey5: 'rgb(46, 47, 46)',
		grey4: 'rgb(59, 60, 59)',
		grey3: 'rgb(79, 81, 79)',
		grey2: 'rgb(122, 125, 122)',
		grey: 'rgb(160, 163, 160)',
		background: 'rgb(1, 2, 1)',
		foreground: 'rgb(251, 253, 251)',
		secondary: 'rgb(162, 167, 160)',
		root: 'rgb(1, 2, 1)',
		card: 'rgb(1, 2, 1)',
		destructive: 'rgb(147, 0, 10)',
		primary: 'rgb(120, 174, 117)',
		text: 'rgb(4, 5, 4)',
		border: 'rgb(48, 50, 47)',
	},
} as const

const COLORS =
	Platform.OS === 'ios'
		? IOS_SYSTEM_COLORS
		: Platform.OS === 'android'
			? ANDROID_COLORS
			: WEB_COLORS

export {COLORS}
