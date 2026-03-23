import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useSnippetStore} from '../store/useSnippetStore'
import {scaleText} from 'react-native-text'
import type {Snippet} from '@shelly/shared'
import React, {useState} from 'react'

const ts = scaleText({fontSize: 14})

interface SnippetManagerModalProps {
	isVisible: boolean
	onClose: () => void
	/** Called with the raw command string (without `\r`) when the user taps a snippet. */
	onSelect: (command: string) => void
}

interface AddForm {
	name: string
	command: string
	category: string
}

const EMPTY_ADD: AddForm = {name: '', command: '', category: ''}

/**
 * Full snippet management modal with search, add, and delete support.
 *
 * Tapping a snippet calls `onSelect` and closes the modal.
 * Deleting prompts an `Alert` confirmation before removing from the store.
 * Adding is done via an inline form revealed by the "Add" header button.
 */
export const SnippetManagerModal: React.FC<SnippetManagerModalProps> = ({
	isVisible,
	onClose,
	onSelect,
}) => {
	const {snippets, addSnippet, removeSnippet} = useSnippetStore()
	const [showAdd, setShowAdd] = useState(false)
	const [addForm, setAddForm] = useState<AddForm>(EMPTY_ADD)
	const [addError, setAddError] = useState('')
	const [searchQuery, setSearchQuery] = useState('')

	const filteredSnippets = snippets.filter(
		s =>
			s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.command.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const handleSelect = (snippet: Snippet) => {
		onSelect(snippet.command)
		handleClose()
	}

	const handleDelete = (id: string, name: string) => {
		Alert.alert('Delete Snippet', `Remove "${name}"?`, [
			{text: 'Cancel', style: 'cancel'},
			{text: 'Delete', style: 'destructive', onPress: () => removeSnippet(id)},
		])
	}

	const handleAdd = async () => {
		if (!addForm.name.trim()) {
			setAddError('Name is required')
			return
		}
		if (!addForm.command.trim()) {
			setAddError('Command is required')
			return
		}
		await addSnippet({
			name: addForm.name.trim(),
			command: addForm.command.trim(),
			category: addForm.category.trim() || undefined,
		})
		setAddForm(EMPTY_ADD)
		setAddError('')
		setShowAdd(false)
	}

	const handleClose = () => {
		setShowAdd(false)
		setAddForm(EMPTY_ADD)
		setAddError('')
		setSearchQuery('')
		onClose()
	}

	const renderSnippet = ({item}: {item: Snippet}) => (
		<View style={styles.snippetRow}>
			{/* Left: tap to use */}
			<TouchableOpacity
				onPress={() => handleSelect(item)}
				style={styles.snippetInfo}
				accessibilityRole="button"
				accessibilityLabel={`Run ${item.name}: ${item.command}`}
			>
				<View style={styles.snippetNameRow}>
					<Text style={[ts, styles.snippetName]} numberOfLines={1}>
						{item.name}
					</Text>
					{item.category != null && item.category !== '' && (
						<View style={styles.categoryBadge}>
							<Text style={styles.categoryText}>{item.category}</Text>
						</View>
					)}
				</View>
				<Text
					style={[ts, styles.snippetCmd]}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{item.command}
				</Text>
			</TouchableOpacity>

			{/* Right: delete */}
			<TouchableOpacity
				onPress={() => handleDelete(item.id, item.name)}
				style={styles.deleteBtn}
				hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
				accessibilityLabel={`Delete ${item.name}`}
				accessibilityRole="button"
			>
				<MaterialCommunityIcons
					name="delete-outline"
					size={19}
					color="#52525b"
				/>
			</TouchableOpacity>
		</View>
	)

	return (
		<Modal
			visible={isVisible}
			animationType="slide"
			transparent
			onRequestClose={handleClose}
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				style={styles.kav}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<View style={styles.backdrop}>
					<SafeAreaView style={styles.sheet} edges={['bottom']}>
						{/* ── Header ── */}
						<View style={styles.header}>
							<Text style={[ts, styles.headerTitle]}>Snippets</Text>
							<View style={styles.headerRight}>
								<TouchableOpacity
									onPress={() => {
										setShowAdd(true)
										setAddError('')
									}}
									style={styles.addBtn}
									accessibilityRole="button"
									accessibilityLabel="Add snippet"
								>
									<MaterialCommunityIcons
										name="plus"
										size={18}
										color="#6366f1"
									/>
									<Text style={[ts, styles.addBtnLabel]}>Add</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleClose}
									hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
									accessibilityLabel="Close"
									accessibilityRole="button"
								>
									<MaterialCommunityIcons
										name="close"
										size={22}
										color="#a1a1aa"
									/>
								</TouchableOpacity>
							</View>
						</View>

						{/* ── Search bar ── */}
						<View style={styles.searchRow}>
							<MaterialCommunityIcons
								name="magnify"
								size={18}
								color="#52525b"
							/>
							<TextInput
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholder="Search snippets…"
								placeholderTextColor="#4b5563"
								style={[ts, styles.searchInput]}
								autoCapitalize="none"
								autoCorrect={false}
								clearButtonMode="while-editing"
								accessibilityLabel="Search snippets"
							/>
						</View>

						{/* ── Inline add form ── */}
						{showAdd && (
							<View style={styles.addForm}>
								<Text style={[ts, styles.addFormTitle]}>New Snippet</Text>
								{addError !== '' && (
									<Text style={styles.addFormError}>{addError}</Text>
								)}
								<TextInput
									value={addForm.name}
									onChangeText={v => setAddForm(p => ({...p, name: v}))}
									placeholder="Name  (e.g. Git Status)"
									placeholderTextColor="#4b5563"
									style={[ts, styles.addInput]}
									accessibilityLabel="Snippet name"
								/>
								<TextInput
									value={addForm.command}
									onChangeText={v => setAddForm(p => ({...p, command: v}))}
									placeholder="Command  (e.g. git status)"
									placeholderTextColor="#4b5563"
									autoCapitalize="none"
									autoCorrect={false}
									style={[ts, styles.addInput]}
									accessibilityLabel="Snippet command"
								/>
								<TextInput
									value={addForm.category}
									onChangeText={v => setAddForm(p => ({...p, category: v}))}
									placeholder="Category  (optional)"
									placeholderTextColor="#4b5563"
									style={[ts, styles.addInput]}
									accessibilityLabel="Snippet category"
								/>
								<View style={styles.addFormActions}>
									<TouchableOpacity
										onPress={() => {
											setShowAdd(false)
											setAddForm(EMPTY_ADD)
											setAddError('')
										}}
										style={styles.addCancel}
										accessibilityRole="button"
									>
										<Text style={[ts, styles.addCancelLabel]}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={handleAdd}
										style={styles.addSave}
										accessibilityRole="button"
									>
										<Text style={[ts, styles.addSaveLabel]}>Save</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}

						{/* ── Snippet list ── */}
						<FlatList
							data={filteredSnippets}
							keyExtractor={item => item.id}
							style={styles.list}
							renderItem={renderSnippet}
							ItemSeparatorComponent={() => <View style={styles.separator} />}
							keyboardShouldPersistTaps="handled"
							ListEmptyComponent={
								<View style={styles.empty}>
									<MaterialCommunityIcons
										name="console-line"
										size={36}
										color="#3f3f46"
									/>
									<Text style={[ts, styles.emptyTitle]}>
										{searchQuery !== ''
											? 'No snippets match your search'
											: 'No snippets yet'}
									</Text>
									{searchQuery === '' && (
										<Text style={[ts, styles.emptyHint]}>
											Tap "+ Add" to create your first snippet
										</Text>
									)}
								</View>
							}
						/>
					</SafeAreaView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	kav: {flex: 1, justifyContent: 'flex-end'},
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.65)',
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: '#18181b',
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		maxHeight: '82%',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 18,
		paddingTop: 18,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#27272a',
	},
	headerTitle: {color: '#ffffff', fontSize: 17, fontWeight: '700'},
	headerRight: {flexDirection: 'row', alignItems: 'center', gap: 16},
	addBtn: {flexDirection: 'row', alignItems: 'center', gap: 4},
	addBtnLabel: {color: '#6366f1', fontWeight: '600', fontSize: 15},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginHorizontal: 16,
		marginVertical: 10,
		paddingHorizontal: 12,
		paddingVertical: Platform.OS === 'ios' ? 9 : 7,
		backgroundColor: '#27272a',
		borderRadius: 10,
	},
	searchInput: {flex: 1, color: '#f4f4f5', fontSize: 14},
	addForm: {
		marginHorizontal: 16,
		marginBottom: 10,
		padding: 14,
		backgroundColor: '#1f1f23',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#3f3f46',
	},
	addFormTitle: {
		color: '#a1a1aa',
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		marginBottom: 10,
	},
	addFormError: {color: '#f87171', fontSize: 11, marginBottom: 8},
	addInput: {
		backgroundColor: '#27272a',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: Platform.OS === 'ios' ? 9 : 7,
		color: '#f4f4f5',
		fontSize: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#3f3f46',
	},
	addFormActions: {flexDirection: 'row', gap: 10, marginTop: 4},
	addCancel: {
		flex: 1,
		paddingVertical: 9,
		alignItems: 'center',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#3f3f46',
	},
	addCancelLabel: {color: '#71717a', fontWeight: '600'},
	addSave: {
		flex: 1,
		paddingVertical: 9,
		alignItems: 'center',
		borderRadius: 8,
		backgroundColor: '#6366f1',
	},
	addSaveLabel: {color: '#ffffff', fontWeight: '700'},
	list: {flex: 1},
	snippetRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 18,
		paddingVertical: 13,
	},
	snippetInfo: {flex: 1},
	snippetNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 3,
	},
	snippetName: {
		color: '#f4f4f5',
		fontWeight: '600',
		fontSize: 14,
		flexShrink: 1,
	},
	categoryBadge: {
		backgroundColor: '#312e81',
		paddingHorizontal: 7,
		paddingVertical: 2,
		borderRadius: 4,
	},
	categoryText: {color: '#818cf8', fontSize: 10, fontWeight: '700'},
	snippetCmd: {color: '#6b7280', fontSize: 12, fontFamily: 'monospace'},
	deleteBtn: {paddingHorizontal: 4, paddingVertical: 4},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#27272a',
		marginHorizontal: 16,
	},
	empty: {alignItems: 'center', paddingVertical: 44, gap: 10},
	emptyTitle: {color: '#71717a', fontSize: 15, textAlign: 'center'},
	emptyHint: {color: '#3f3f46', fontSize: 13, textAlign: 'center'},
})
