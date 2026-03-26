const {getDefaultConfig} = require('expo/metro-config')
const {withNativeWind} = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
const previousEnhanceMiddleware = config.server?.enhanceMiddleware

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
