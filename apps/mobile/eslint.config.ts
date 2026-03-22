import pluginReact from 'eslint-plugin-react'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import js from '@eslint/js'

const jsxRuntime = pluginReact.configs.flat?.['jsx-runtime']

export default defineConfig([
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.expo/**',
			'tailwind.config.js',
			'babel.config.js',
			'metro.config.js',
		],
	},
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		plugins: {js},
		extends: ['js/recommended'],
		languageOptions: {
			globals: {...globals.browser, ...globals.node},
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...tseslint.configs.recommended,
	// Use jsx-runtime config (React 17+ automatic transform, no class-component rules)
	...(Array.isArray(jsxRuntime) ? jsxRuntime : jsxRuntime ? [jsxRuntime] : []),
	{
		settings: {
			react: {version: 'detect'},
		},
		rules: {
			// Allow `any` for GitHub API response types (warn, not error)
			'@typescript-eslint/no-explicit-any': 'warn',
			// Allow unescaped apostrophes in JSX text
			'react/no-unescaped-entities': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
])
