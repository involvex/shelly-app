import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {KEYBAR_ROW_PRESETS, useKeybarStore} from '@/store/useKeybarStore'
import type {KeybarRow} from '@/store/useKeybarStore'
import {Stack} from 'expo-router'
import {useState} from 'react'

export default function KeybarEditorScreen() {
	const {rows, addRow, removeRow, moveRow, resetToDefaults} = useKeybarStore()
	const [presetModalOpen, setPresetModalOpen] = useState(false)

	const confirmReset = () => {
		Alert.alert(
			'Reset Keyboard Rows',
			'Restore all rows to factory defaults?',
			[
				{text: 'Cancel', style: 'cancel'},
				{
					text: 'Reset',
					style: 'destructive',
					onPress: () => void resetToDefaults(),
				},
			],
		)
	}

	const confirmRemove = (id: string, label: string) => {
		Alert.alert('Remove Row', `Remove "${label}"?`, [
			{text: 'Cancel', style: 'cancel'},
			{
				text: 'Remove',
				style: 'destructive',
				onPress: () => removeRow(id),
			},
		])
	}

	const renderRow = ({item, index}: {item: KeybarRow; index: number}) => {
		const isFirst = index === 0
		const isLast = index === rows.length - 1

		return (
			<View style={styles.rowItem}>
				<View style={styles.rowMain}>
					<Text style={styles.rowLabel}>{item.label}</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.chipScroll}
					>
						{item.buttons.slice(0, 7).map(btn => (
							<View key={btn.id} style={styles.chip}>
								{btn.icon ? (
									<MaterialCommunityIcons
										name={btn.icon as never}
										size={10}
										color="#a1a1aa"
									/>
								) : (
									<Text style={styles.chipText}>{btn.label}</Text>
								)}
							</View>
						))}
						{item.buttons.length > 7 && (
							<View style={styles.chip}>
								<Text style={styles.chipText}>+{item.buttons.length - 7}</Text>
							</View>
						)}
					</ScrollView>
				</View>

				<View style={styles.rowActions}>
					<TouchableOpacity
						onPress={() => void moveRow(index, index - 1)}
						disabled={isFirst}
						style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
						accessibilityLabel="Move row up"
					>
						<MaterialCommunityIcons
							name="arrow-up"
							size={16}
							color={isFirst ? '#3a3a3e' : '#a1a1aa'}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => void moveRow(index, index + 1)}
						disabled={isLast}
						style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
						accessibilityLabel="Move row down"
					>
						<MaterialCommunityIcons
							name="arrow-down"
							size={16}
							color={isLast ? '#3a3a3e' : '#a1a1aa'}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => confirmRemove(item.id, item.label)}
						style={styles.deleteBtn}
						accessibilityLabel="Delete row"
					>
						<MaterialCommunityIcons
							name="trash-can-outline"
							size={16}
							color="#f87171"
						/>
					</TouchableOpacity>
				</View>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					headerRight: () => (
						<TouchableOpacity
							onPress={confirmReset}
							style={styles.headerResetBtn}
						>
							<Text style={styles.headerResetText}>Reset</Text>
						</TouchableOpacity>
					),
				}}
			/>

			<FlatList
				data={rows}
				keyExtractor={item => item.id}
				renderItem={renderRow}
				ListEmptyComponent={
					<Text style={styles.emptyText}>
						No rows yet. Tap "Add Row from Preset" to get started.
					</Text>
				}
				ListFooterComponent={
					<TouchableOpacity
						onPress={() => setPresetModalOpen(true)}
						style={styles.addBtn}
						accessibilityRole="button"
						accessibilityLabel="Add a row from preset"
					>
						<MaterialCommunityIcons
							name="plus-circle-outline"
							size={18}
							color="#6366f1"
						/>
						<Text style={styles.addBtnText}>Add Row from Preset</Text>
					</TouchableOpacity>
				}
				contentContainerStyle={styles.list}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
			/>

			{/* Preset picker bottom sheet */}
			<Modal
				visible={presetModalOpen}
				animationType="slide"
				transparent
				// Prevents Android from resizing the modal container when the soft
				// keyboard appears, which causes the screen-flicker / keyboard-jump.
				statusBarTranslucent
				hardwareAccelerated
				onRequestClose={() => setPresetModalOpen(false)}
			>
				<Pressable
					style={styles.modalBackdrop}
					onPress={() => setPresetModalOpen(false)}
				/>
				<View style={styles.modalSheet}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Add Row</Text>
						<TouchableOpacity onPress={() => setPresetModalOpen(false)}>
							<MaterialCommunityIcons name="close" size={22} color="#6b7280" />
						</TouchableOpacity>
					</View>

					<ScrollView>
						{KEYBAR_ROW_PRESETS.map(preset => {
							const preview = preset.make()
							return (
								<TouchableOpacity
									key={preset.id}
									style={styles.presetRow}
									onPress={() => {
										void addRow(preset)
										setPresetModalOpen(false)
									}}
								>
									<MaterialCommunityIcons
										name={preset.icon as never}
										size={20}
										color="#6366f1"
										style={styles.presetIcon}
									/>
									<View style={styles.presetLeft}>
										<Text style={styles.presetName}>{preset.label}</Text>
										<Text style={styles.presetHint}>
											{preview.buttons
												.slice(0, 6)
												.map(b => b.label)
												.join('  ·  ')}
											{preview.buttons.length > 6 ? '  …' : ''}
										</Text>
									</View>
									<MaterialCommunityIcons
										name="plus"
										size={18}
										color="#52525b"
									/>
								</TouchableOpacity>
							)
						})}
					</ScrollView>
				</View>
			</Modal>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0f0f0f',
	},
	list: {
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 48,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#2a2a2e',
	},

	/* Row items */
	rowItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1c1c1e',
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 1,
	},
	rowMain: {
		flex: 1,
		gap: 6,
	},
	rowLabel: {
		fontSize: 15,
		fontWeight: '600',
		color: '#e2e2e6',
	},
	chipScroll: {
		flexGrow: 0,
	},
	chip: {
		backgroundColor: '#2a2a2e',
		borderRadius: 4,
		paddingHorizontal: 6,
		paddingVertical: 3,
		marginRight: 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chipText: {
		fontSize: 10,
		color: '#a1a1aa',
		fontWeight: '500',
	},
	rowActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginLeft: 8,
	},
	arrowBtn: {
		width: 30,
		height: 30,
		borderRadius: 6,
		backgroundColor: '#2a2a2e',
		alignItems: 'center',
		justifyContent: 'center',
	},
	arrowBtnDisabled: {
		opacity: 0.3,
	},
	deleteBtn: {
		width: 30,
		height: 30,
		borderRadius: 6,
		backgroundColor: '#2d1b1b',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 4,
	},

	/* Empty state */
	emptyText: {
		textAlign: 'center',
		color: '#52525b',
		fontSize: 14,
		marginTop: 40,
		marginHorizontal: 32,
		lineHeight: 20,
	},

	/* Add row button */
	addBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		padding: 14,
		borderRadius: 10,
		backgroundColor: '#1c1c1e',
		borderWidth: 1,
		borderColor: '#2a2a2e',
		gap: 8,
	},
	addBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#6366f1',
	},

	/* Header */
	headerResetBtn: {
		marginRight: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	headerResetText: {
		fontSize: 15,
		color: '#f87171',
		fontWeight: '600',
	},

	/* Modal bottom sheet */
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalSheet: {
		backgroundColor: '#1c1c1e',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingBottom: 32,
		maxHeight: '70%',
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#2a2a2e',
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: '#e2e2e6',
	},
	presetRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#2a2a2e',
		gap: 12,
	},
	presetIcon: {
		width: 24,
	},
	presetLeft: {
		flex: 1,
	},
	presetName: {
		fontSize: 15,
		fontWeight: '600',
		color: '#e2e2e6',
	},
	presetHint: {
		fontSize: 11,
		color: '#6b7280',
		marginTop: 2,
	},
})
