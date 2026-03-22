import AsyncStorage from '@react-native-async-storage/async-storage'
import type {Snippet} from '@shelly/shared'
import {create} from 'zustand'

interface SnippetState {
	snippets: Snippet[]
	addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<void>
	removeSnippet: (id: string) => Promise<void>
	loadSnippets: () => Promise<void>
}

const STORAGE_KEY = '@shelly/snippets'

export const useSnippetStore = create<SnippetState>((set, get) => ({
	snippets: [],

	addSnippet: async snippet => {
		const newSnippet = {
			...snippet,
			id: Math.random().toString(36).substring(7),
		} as Snippet
		const updated = [...get().snippets, newSnippet]
		set({snippets: updated})
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
	},

	removeSnippet: async id => {
		const updated = get().snippets.filter(s => s.id !== id)
		set({snippets: updated})
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
	},

	loadSnippets: async () => {
		const stored = await AsyncStorage.getItem(STORAGE_KEY)
		if (stored) {
			set({snippets: JSON.parse(stored)})
		} else {
			// Add some defaults
			const defaults: Snippet[] = [
				{id: '1', name: 'Git Status', command: 'git status'},
				{id: '2', name: 'Build Project', command: 'bun run build'},
				{id: '3', name: 'List Files', command: 'dir'},
				{id: '4', name: 'Get .env', command: 'cat .env'},
			]
			set({snippets: defaults})
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
		}
	},
}))
