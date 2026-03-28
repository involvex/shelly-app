const {getDefaultConfig} = require('expo/metro-config')
const {withNativeWind} = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
const previousEnhanceMiddleware = config.server?.enhanceMiddleware

// Block @xterm/* packages on non-web platforms — they reference browser globals
// (self, document, window) that don't exist in React Native's JS runtime.
const originalResolveRequest = config.resolver?.resolveRequest
config.resolver = {
	...config.resolver,
	resolveRequest: (context, moduleName, platform) => {
		if (platform !== 'web' && moduleName.startsWith('@xterm/')) {
			return {type: 'empty'}
		}
		if (typeof originalResolveRequest === 'function') {
			return originalResolveRequest(context, moduleName, platform)
		}
		return context.resolveRequest(context, moduleName, platform)
	},
}

config.server = {
	...config.server,
	enhanceMiddleware: middleware => {
		const upstream =
			typeof previousEnhanceMiddleware === 'function'
				? previousEnhanceMiddleware(middleware)
				: middleware

		return (req, res, next) => {
			if (!req.headers.host) {
				req.headers.host = 'localhost:8081'
				console.warn(
					'[Metro] Missing host header from local client request; defaulting to localhost:8081.',
				)
			}

			return upstream(req, res, next)
		}
	},
}

module.exports = withNativeWind(config, {input: './src/global.css'})
