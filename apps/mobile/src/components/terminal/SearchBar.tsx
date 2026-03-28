import React, {useCallback, useEffect, useRef, useState} from 'react'
import type {SearchAddon, ISearchOptions} from '@xterm/addon-search'

interface SearchBarProps {
	searchAddon: SearchAddon | null
	onClose: () => void
	accentColor?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
	searchAddon,
	onClose,
	accentColor = '#6366f1',
}) => {
	const [query, setQuery] = useState('')
	const [caseSensitive, setCaseSensitive] = useState(false)
	const [resultIndex, setResultIndex] = useState(-1)
	const [resultCount, setResultCount] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	useEffect(() => {
		if (!searchAddon) return
		const d = searchAddon.onDidChangeResults(e => {
			setResultIndex(e.resultIndex)
			setResultCount(e.resultCount)
		})
		return () => d.dispose()
	}, [searchAddon])

	const doSearch = useCallback(
		(direction: 'next' | 'prev') => {
			if (!searchAddon || !query) return
			const opts: ISearchOptions = {caseSensitive}
			if (direction === 'next') {
				searchAddon.findNext(query, opts)
			} else {
				searchAddon.findPrevious(query, opts)
			}
		},
		[searchAddon, query, caseSensitive],
	)

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value
			setQuery(val)
			if (searchAddon && val) {
				searchAddon.findNext(val, {
					caseSensitive,
					incremental: true,
				})
			}
			if (!val && searchAddon) {
				searchAddon.clearDecorations()
			}
		},
		[searchAddon, caseSensitive],
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault()
				doSearch(e.shiftKey ? 'prev' : 'next')
			} else if (e.key === 'Escape') {
				e.preventDefault()
				searchAddon?.clearDecorations()
				onClose()
			}
		},
		[doSearch, onClose, searchAddon],
	)

	return (
		<div
			style={{
				position: 'absolute',
				top: 8,
				right: 8,
				zIndex: 100,
				display: 'flex',
				alignItems: 'center',
				gap: 4,
				backgroundColor: '#1a1a1a',
				border: '1px solid #3f3f46',
				borderRadius: 8,
				padding: '4px 8px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
			}}
		>
			<input
				ref={inputRef}
				value={query}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder="Search..."
				style={{
					backgroundColor: '#27272a',
					border: '1px solid #3f3f46',
					borderRadius: 4,
					color: '#f4f4f5',
					fontSize: 13,
					padding: '4px 8px',
					width: 180,
					outline: 'none',
				}}
			/>
			{query && (
				<span
					style={{
						color: '#71717a',
						fontSize: 11,
						whiteSpace: 'nowrap',
						minWidth: 40,
						textAlign: 'center',
					}}
				>
					{resultCount > 0 ? `${resultIndex + 1}/${resultCount}` : '0'}
				</span>
			)}
			<button
				type="button"
				onClick={() => doSearch('prev')}
				style={{
					background: 'none',
					border: 'none',
					color: '#a1a1aa',
					fontSize: 16,
					cursor: 'pointer',
					padding: '2px 6px',
					borderRadius: 4,
				}}
				title="Previous (Shift+Enter)"
			>
				&#9650;
			</button>
			<button
				type="button"
				onClick={() => doSearch('next')}
				style={{
					background: 'none',
					border: 'none',
					color: '#a1a1aa',
					fontSize: 16,
					cursor: 'pointer',
					padding: '2px 6px',
					borderRadius: 4,
				}}
				title="Next (Enter)"
			>
				&#9660;
			</button>
			<button
				type="button"
				onClick={() => setCaseSensitive(!caseSensitive)}
				style={{
					background: caseSensitive ? accentColor : 'none',
					border: 'none',
					color: caseSensitive ? '#fff' : '#71717a',
					fontSize: 11,
					fontWeight: 700,
					cursor: 'pointer',
					padding: '3px 6px',
					borderRadius: 4,
				}}
				title="Case Sensitive"
			>
				Aa
			</button>
			<button
				type="button"
				onClick={() => {
					searchAddon?.clearDecorations()
					onClose()
				}}
				style={{
					background: 'none',
					border: 'none',
					color: '#71717a',
					fontSize: 16,
					cursor: 'pointer',
					padding: '2px 6px',
					borderRadius: 4,
				}}
				title="Close (Esc)"
			>
				&#10005;
			</button>
		</div>
	)
}
