import {Linking, Platform} from 'react-native'

export function createLinkHandler() {
	return (event: MouseEvent, uri: string) => {
		if (Platform.OS === 'web') {
			window.open(uri, '_blank', 'noopener,noreferrer')
		} else {
			Linking.openURL(uri)
		}
	}
}
