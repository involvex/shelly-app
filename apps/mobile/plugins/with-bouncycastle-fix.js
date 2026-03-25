/* eslint-disable @typescript-eslint/no-require-imports */
const {withAppBuildGradle, createRunOncePlugin} = require('expo/config-plugins')

const EXCLUSION_BLOCK = `configurations.configureEach {
    exclude group: "org.bouncycastle", module: "bcprov-jdk15on"
}`

function withBouncycastleFix(config) {
	return withAppBuildGradle(config, configProps => {
		const {modResults} = configProps
		if (!modResults.contents.includes(EXCLUSION_BLOCK)) {
			modResults.contents = `${modResults.contents.trimEnd()}\n\n${EXCLUSION_BLOCK}\n`
		}
		return configProps
	})
}

module.exports = createRunOncePlugin(
	withBouncycastleFix,
	'with-bouncycastle-fix',
	'1.0.0',
)
