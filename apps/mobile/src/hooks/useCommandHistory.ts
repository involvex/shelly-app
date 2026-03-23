import {useCallback, useState} from 'react'

/**
 * Manages a local command history array with keyboard-style up/down navigation.
 *
 * History is stored oldest-first: history[0] is the oldest entry,
 * history[length-1] is the most recent.
 *
 * Navigation index (`navIndex`):
 *   -1            → "fresh input" state (user is typing a new command)
 *   0             → history[length - 1] (most recent entry)
 *   1             → history[length - 2]
 *   …
 *   length - 1    → history[0] (oldest entry)
 *
 * Both `navigateUp` and `navigateDown` close over the current state values
 * (via the dependency array), so there are no stale-closure issues even though
 * each call triggers a `setState` before returning the resolved string.
 */
export function useCommandHistory() {
	const [history, setHistory] = useState<string[]>([])
	const [navIndex, setNavIndex] = useState(-1)

	/**
	 * Record a successfully-submitted command and reset the navigation position.
	 * Consecutive duplicates are silently discarded.
	 */
	const addCommand = useCallback((command: string) => {
		if (!command.trim()) return
		setHistory(prev => {
			if (prev[prev.length - 1] === command) return prev
			return [...prev, command]
		})
		setNavIndex(-1)
	}, [])

	/**
	 * Navigate to an older command (Up arrow behaviour).
	 * Returns the command text, or `null` if the history is empty.
	 */
	const navigateUp = useCallback((): string | null => {
		if (history.length === 0) return null
		const next =
			navIndex === -1 ? 0 : Math.min(navIndex + 1, history.length - 1)
		setNavIndex(next)
		return history[history.length - 1 - next] ?? null
	}, [history, navIndex])

	/**
	 * Navigate to a newer command (Down arrow behaviour).
	 * Returns `''` when the user reaches the "fresh input" state again.
	 * Returns `null` when there is no active navigation to step forward from.
	 */
	const navigateDown = useCallback((): string | null => {
		if (navIndex === -1) return null
		if (navIndex === 0) {
			setNavIndex(-1)
			return ''
		}
		const next = navIndex - 1
		setNavIndex(next)
		return history[history.length - 1 - next] ?? null
	}, [history, navIndex])

	/** Reset navigation without adding to history (e.g. when Escape is pressed). */
	const resetNavigation = useCallback(() => {
		setNavIndex(-1)
	}, [])

	return {
		history,
		navIndex,
		addCommand,
		navigateUp,
		navigateDown,
		resetNavigation,
	}
}
