/**
 * Bump the patch version across all version files in the monorepo.
 *
 * Updates:
 *  - package.json (root)            → version
 *  - apps/mobile/package.json       → version
 *  - apps/mobile/app.json           → version + android.versionCode
 *
 * Usage: bun run version:patch
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const rootDir = join(import.meta.dir, '..')

const ROOT_PKG = join(rootDir, 'package.json')
const MOBILE_PKG = join(rootDir, 'apps', 'mobile', 'package.json')
const APP_JSON = join(rootDir, 'apps', 'mobile', 'app.json')

interface PackageJson {
	version: string
	[key: string]: unknown
}

interface AppJson {
	version: string
	android: {
		versionCode: number
		[key: string]: unknown
	}
	[key: string]: unknown
}

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf-8')) as T
}

function writeJson(path: string, data: unknown): void {
	writeFileSync(path, JSON.stringify(data, null, '\t') + '\n', 'utf-8')
}

function bumpPatch(version: string): string {
	const [major, minor, patch] = version.split('.').map(Number)
	return `${major ?? 0}.${minor ?? 0}.${(patch ?? 0) + 1}`
}

const rootPkg = readJson<PackageJson>(ROOT_PKG)
const mobilePkg = readJson<PackageJson>(MOBILE_PKG)
const appJson = readJson<AppJson>(APP_JSON)

const oldVersion = rootPkg.version
const newVersion = bumpPatch(oldVersion)
const oldVersionCode = appJson.android?.versionCode ?? 0
const newVersionCode = oldVersionCode + 1

console.log(`\n📦  Version bump`)
console.log(`   semver   : ${oldVersion} → ${newVersion}`)
console.log(`   versionCode: ${oldVersionCode} → ${newVersionCode}\n`)

writeJson(ROOT_PKG, {...rootPkg, version: newVersion})
writeJson(MOBILE_PKG, {...mobilePkg, version: newVersion})
writeJson(APP_JSON, {
	...appJson,
	version: newVersion,
	android: {...appJson.android, versionCode: newVersionCode},
})

console.log(`✅  Done — new version: ${newVersion}`)
