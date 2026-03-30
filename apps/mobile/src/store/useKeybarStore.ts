import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'

const STORAGE_KEY = 'shelly_keybar_v1'

const uid = (): string => Math.random().toString(36).slice(2, 9)

export interface KeybarButton {
	id: string
	label: string
	/** Escape sequence or text to send to the shell. */
	code: string
	/** Optional MaterialCommunityIcons name for icon-only rendering. */
	icon?: string
}

export interface KeybarRow {
	id: string
	label: string
	buttons: KeybarButton[]
}

// ─── Row factory functions ──────────────────────────────────────────────────

function makeBasicRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Basic',
		buttons: [
			{id: uid(), label: 'Tab', code: '\t'},
			{id: uid(), label: 'Esc', code: '\x1b'},
			{id: uid(), label: '↑', code: '\x1b[A', icon: 'arrow-up'},
			{id: uid(), label: '↓', code: '\x1b[B', icon: 'arrow-down'},
			{id: uid(), label: '←', code: '\x1b[D', icon: 'arrow-left'},
			{id: uid(), label: '→', code: '\x1b[C', icon: 'arrow-right'},
			{id: uid(), label: '^C', code: '\x03'},
			{id: uid(), label: '^D', code: '\x04'},
			{id: uid(), label: '^Z', code: '\x1a'},
		],
	}
}

function makeArrowsRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Arrows',
		buttons: [
			{id: uid(), label: '↑', code: '\x1b[A', icon: 'arrow-up'},
			{id: uid(), label: '↓', code: '\x1b[B', icon: 'arrow-down'},
			{id: uid(), label: '←', code: '\x1b[D', icon: 'arrow-left'},
			{id: uid(), label: '→', code: '\x1b[C', icon: 'arrow-right'},
			{id: uid(), label: 'PgUp', code: '\x1b[5~'},
			{id: uid(), label: 'PgDn', code: '\x1b[6~'},
		],
	}
}

function makeNavigationRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Navigation',
		buttons: [
			{id: uid(), label: 'Home', code: '\x1b[H'},
			{id: uid(), label: 'End', code: '\x1b[F'},
			{id: uid(), label: 'PgUp', code: '\x1b[5~'},
			{id: uid(), label: 'PgDn', code: '\x1b[6~'},
			{id: uid(), label: 'Ins', code: '\x1b[2~'},
			{id: uid(), label: 'Del', code: '\x1b[3~'},
		],
	}
}

function makeFunctionRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Function Keys',
		buttons: [
			{id: uid(), label: 'F1', code: '\x1bOP'},
			{id: uid(), label: 'F2', code: '\x1bOQ'},
			{id: uid(), label: 'F3', code: '\x1bOR'},
			{id: uid(), label: 'F4', code: '\x1bOS'},
			{id: uid(), label: 'F5', code: '\x1b[15~'},
			{id: uid(), label: 'F6', code: '\x1b[17~'},
			{id: uid(), label: 'F7', code: '\x1b[18~'},
			{id: uid(), label: 'F8', code: '\x1b[19~'},
			{id: uid(), label: 'F9', code: '\x1b[20~'},
			{id: uid(), label: 'F10', code: '\x1b[21~'},
			{id: uid(), label: 'F11', code: '\x1b[23~'},
			{id: uid(), label: 'F12', code: '\x1b[24~'},
		],
	}
}

function makeSymbolsRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Symbols',
		buttons: [
			{id: uid(), label: '~', code: '~'},
			{id: uid(), label: '!', code: '!'},
			{id: uid(), label: '@', code: '@'},
			{id: uid(), label: '#', code: '#'},
			{id: uid(), label: '$', code: '$'},
			{id: uid(), label: '%', code: '%'},
			{id: uid(), label: '^', code: '^'},
			{id: uid(), label: '&', code: '&'},
			{id: uid(), label: '*', code: '*'},
			{id: uid(), label: '|', code: '|'},
			{id: uid(), label: '\\', code: '\\'},
			{id: uid(), label: '/', code: '/'},
			{id: uid(), label: '-', code: '-'},
			{id: uid(), label: '_', code: '_'},
			{id: uid(), label: '=', code: '='},
			{id: uid(), label: '+', code: '+'},
			{id: uid(), label: '{', code: '{'},
			{id: uid(), label: '}', code: '}'},
			{id: uid(), label: '[', code: '['},
			{id: uid(), label: ']', code: ']'},
			{id: uid(), label: '<', code: '<'},
			{id: uid(), label: '>', code: '>'},
			{id: uid(), label: '?', code: '?'},
		],
	}
}

function makeCtrlRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Ctrl Keys',
		buttons: [
			{id: uid(), label: 'C-A', code: '\x01'},
			{id: uid(), label: 'C-B', code: '\x02'},
			{id: uid(), label: 'C-C', code: '\x03'},
			{id: uid(), label: 'C-D', code: '\x04'},
			{id: uid(), label: 'C-E', code: '\x05'},
			{id: uid(), label: 'C-F', code: '\x06'},
			{id: uid(), label: 'C-K', code: '\x0b'},
			{id: uid(), label: 'C-L', code: '\x0c'},
			{id: uid(), label: 'C-R', code: '\x12'},
			{id: uid(), label: 'C-T', code: '\x14'},
			{id: uid(), label: 'C-U', code: '\x15'},
			{id: uid(), label: 'C-W', code: '\x17'},
			{id: uid(), label: 'C-Z', code: '\x1a'},
		],
	}
}

function makeVimRow(): KeybarRow {
	return {
		id: uid(),
		label: 'Vim',
		buttons: [
			{id: uid(), label: 'Esc', code: '\x1b'},
			{id: uid(), label: 'i', code: 'i'},
			{id: uid(), label: 'a', code: 'a'},
			{id: uid(), label: 'A', code: 'A'},
			{id: uid(), label: 'o', code: 'o'},
			{id: uid(), label: 'u', code: 'u'},
			{id: uid(), label: 'C-R', code: '\x12'},
			{id: uid(), label: ':w', code: ':w\r'},
			{id: uid(), label: ':q', code: ':q\r'},
			{id: uid(), label: ':wq', code: ':wq\r'},
			{id: uid(), label: ':q!', code: ':q!\r'},
			{id: uid(), label: '/', code: '/'},
			{id: uid(), label: 'n', code: 'n'},
			{id: uid(), label: 'N', code: 'N'},
			{id: uid(), label: 'dd', code: 'dd'},
			{id: uid(), label: 'yy', code: 'yy'},
			{id: uid(), label: 'p', code: 'p'},
		],
	}
}

// ─── Available presets for the "Add Row" picker ──────────────────────────────

export interface KeybarRowPreset {
	id: string
	label: string
	icon: string
	make: () => KeybarRow
}

export const KEYBAR_ROW_PRESETS: KeybarRowPreset[] = [
	{
		id: 'basic',
		label: 'Basic  (Tab, Esc, ↑↓←→, ^C…)',
		icon: 'keyboard-outline',
		make: makeBasicRow,
	},
	{
		id: 'arrows',
		label: 'Arrows  (↑↓←→ + PgUp/PgDn)',
		icon: 'arrow-all',
		make: makeArrowsRow,
	},
	{
		id: 'navigation',
		label: 'Navigation  (Home/End/Pg/Ins/Del)',
		icon: 'directions-fork',
		make: makeNavigationRow,
	},
	{
		id: 'function',
		label: 'Function Keys  (F1–F12)',
		icon: 'keyboard-f1',
		make: makeFunctionRow,
	},
	{
		id: 'symbols',
		label: 'Symbols  (~!@#$…)',
		icon: 'code-tags',
		make: makeSymbolsRow,
	},
	{
		id: 'ctrl',
		label: 'Ctrl Keys  (C-A/B/C/D…)',
		icon: 'alpha-c-box-outline',
		make: makeCtrlRow,
	},
	{
		id: 'vim',
		label: 'Vim Commands',
		icon: 'vim',
		make: makeVimRow,
	},
]

// ─── Default rows shown on first launch ──────────────────────────────────────

function makeDefaultRows(): KeybarRow[] {
	return [makeBasicRow(), makeArrowsRow(), makeNavigationRow()]
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface KeybarState {
	rows: KeybarRow[]
	/** When false, only the first row is shown. */
	isExpanded: boolean
	/** Number of rows to show when collapsed (default 1). */
	collapsedRowCount: number
	load: () => Promise<void>
	setRows: (rows: KeybarRow[]) => Promise<void>
	addRow: (preset: KeybarRowPreset) => Promise<void>
	removeRow: (rowId: string) => Promise<void>
	moveRow: (fromIdx: number, toIdx: number) => Promise<void>
	toggleExpanded: () => void
	resetToDefaults: () => Promise<void>
}

export const useKeybarStore = create<KeybarState>((set, get) => ({
	rows: makeDefaultRows(),
	isExpanded: false,
	collapsedRowCount: 1,

	load: async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY)
			if (raw) {
				const parsed = JSON.parse(raw) as Partial<KeybarState>
				if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
					set({
						rows: parsed.rows,
						isExpanded: parsed.isExpanded ?? false,
						collapsedRowCount: parsed.collapsedRowCount ?? 1,
					})
					return
				}
			}
		} catch {
			// fall through to defaults
		}
		set({rows: makeDefaultRows(), isExpanded: false, collapsedRowCount: 1})
	},

	setRows: async rows => {
		set({rows})
		await persist({
			rows,
			isExpanded: get().isExpanded,
			collapsedRowCount: get().collapsedRowCount,
		})
	},

	addRow: async preset => {
		const newRow = preset.make()
		const rows = [...get().rows, newRow]
		set({rows})
		await persist({
			rows,
			isExpanded: get().isExpanded,
			collapsedRowCount: get().collapsedRowCount,
		})
	},

	removeRow: async rowId => {
		const rows = get().rows.filter(r => r.id !== rowId)
		set({rows})
		await persist({
			rows,
			isExpanded: get().isExpanded,
			collapsedRowCount: get().collapsedRowCount,
		})
	},

	moveRow: async (fromIdx, toIdx) => {
		const rows = [...get().rows]
		const [item] = rows.splice(fromIdx, 1)
		if (item === undefined) return
		rows.splice(toIdx, 0, item)
		set({rows})
		await persist({
			rows,
			isExpanded: get().isExpanded,
			collapsedRowCount: get().collapsedRowCount,
		})
	},

	toggleExpanded: () => {
		const isExpanded = !get().isExpanded
		set({isExpanded})
		void persist({
			rows: get().rows,
			isExpanded,
			collapsedRowCount: get().collapsedRowCount,
		})
	},

	resetToDefaults: async () => {
		const rows = makeDefaultRows()
		set({rows, isExpanded: false, collapsedRowCount: 1})
		await persist({rows, isExpanded: false, collapsedRowCount: 1})
	},
}))

async function persist(state: {
	rows: KeybarRow[]
	isExpanded: boolean
	collapsedRowCount: number
}): Promise<void> {
	try {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		// Non-fatal
	}
}
