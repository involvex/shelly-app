import {readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'

const require = createRequire(import.meta.url)
const packageJsonPath =
	require.resolve('@dylankenneally/react-native-ssh-sftp/package.json')
const buildGradlePath = join(
	dirname(packageJsonPath),
	'android',
	'build.gradle',
)
const originalContents = readFileSync(buildGradlePath, 'utf8')

if (!originalContents.includes('jcenter()')) {
	if (!originalContents.includes('mavenCentral()')) {
		throw new Error(
			`Expected mavenCentral() in ${buildGradlePath}, but it was not found.`,
		)
	}

	console.log(
		`SSH/SFTP Gradle repositories already normalized: ${buildGradlePath}`,
	)
	process.exit(0)
}

const updatedContents = originalContents.replaceAll(
	'jcenter()',
	'mavenCentral()',
)

if (updatedContents.includes('jcenter()')) {
	throw new Error(
		`Failed to replace all jcenter() references in ${buildGradlePath}.`,
	)
}

writeFileSync(buildGradlePath, updatedContents)

console.log(`Patched SSH/SFTP Gradle repositories: ${buildGradlePath}`)
