import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type {SymbolViewProps} from 'expo-symbols'
import type {IconMapper} from 'rn-icon-mapper'

type MaterialCommunityIconsProps = React.ComponentProps<
	typeof MaterialCommunityIcons
>
type MaterialIconsProps = React.ComponentProps<typeof MaterialIcons>

type Style = SymbolViewProps['style'] &
	MaterialIconsProps['style'] &
	MaterialCommunityIconsProps['style']

type SymbolViewPropsWithStringName = Omit<SymbolViewProps, 'name'> & {
	name: string
}

type IconProps = IconMapper<
	SymbolViewPropsWithStringName,
	MaterialIconsProps,
	MaterialCommunityIconsProps
> & {
	style?: Style
	className?: string
}

export type {IconProps}
