import * as pluginReact from 'eslint-plugin-react'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import * as globals from 'globals'
import * as js from '@eslint/js'
import css from '@eslint/css'

const reactConfig = pluginReact.configs.flat.recommended

export default defineConfig([
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.expo/**',
			'**/.next/**',
			'**/.turbo/**',
			'**/.wrangler/**',
			'**/coverage/**',
			'**/metro.config.js',
			// Agent/AI tool directories — not source code, should not be linted
			'.agent/**',
			'.agents/**',
			'.kilo/**',
			'.kilocode/**',
			'.claude/**',
			'.gemini/**',
			'agents/**',
			'docs/skills/**',
			'apps/mobile/tailwind.config.js',
		],
	},
	{
		files: ['**/*.css'],
		plugins: {css},
		language: 'css/css',
		extends: ['css/recommended'],
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		plugins: {js},
		extends: ['js/recommended'],
		languageOptions: {
			globals: {...globals.browser, ...globals.node},
		},
	},
	{
		files: ['**/*.{ts,mts,cts,jsx,tsx}'],
		plugins: {js},
		extends: ['js/recommended'],
		languageOptions: {
			globals: {...globals.browser, ...globals.node},
		},
	},
	...(Array.isArray(reactConfig)
		? reactConfig.map(config => ({
				...config,
				files: (config.files || ['**/*.{ts,mts,cts,jsx,tsx}']).filter(
					(pattern: string) => !pattern.includes('.css'),
				),
				settings: {
					...config.settings,
					react: {
						version: '19.0',
					},
				},
				rules: {
					...config.rules,
					'react/react-in-jsx-scope': 'off',
				},
			}))
		: reactConfig
			? [
					{
						...reactConfig,
						files: ['**/*.{ts,mts,cts,jsx,tsx}'],
						settings: {
							react: {version: '19.0'},
						},
						rules: {
							...reactConfig.rules,
							'react/react-in-jsx-scope': 'off',
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
				]
			: []),
	...tseslint.configs.recommended,
])
