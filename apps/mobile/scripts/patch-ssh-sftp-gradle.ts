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
const nativeModulePath = join(
	dirname(packageJsonPath),
	'android',
	'src',
	'main',
	'java',
	'me',
	'keeex',
	'rnssh',
	'RNSshClientModule.java',
)
const originalContents = readFileSync(buildGradlePath, 'utf8')
const nativeModuleContents = readFileSync(nativeModulePath, 'utf8')

const legacyDisconnectBlock = `  @ReactMethod
	public void disconnect(final String key) {
		this.closeShell(key);
		this.disconnectSFTP(key);

		SSHClient client = clientPool.get(key);
		if (client != null) {
				client._session.disconnect();
		}
	}`

const patchedDisconnectBlock = `  @ReactMethod
	public void disconnect(final String key) {
		new Thread(new Runnable()  {
			public void run() {
				SSHClient client = clientPool.get(key);
				if (client == null) {
						return;
				}

				try {
					if (client._channel != null) {
						client._channel.disconnect();
						client._channel = null;
					}

					if (client._dataOutputStream != null) {
						client._dataOutputStream.flush();
						client._dataOutputStream.close();
						client._dataOutputStream = null;
					}

					if (client._bufferedReader != null) {
						client._bufferedReader.close();
						client._bufferedReader = null;
					}
				} catch (IOException error) {
					Log.e(LOGTAG, "Error closing shell during disconnect:" + error.getMessage());
				} catch (Exception error) {
					Log.e(LOGTAG, "Error closing shell during disconnect:" + error.getMessage());
				}

				try {
					if (client._sftpSession != null) {
						client._sftpSession.disconnect();
						client._sftpSession = null;
					}
				} catch (Exception error) {
					Log.e(LOGTAG, "Error disconnecting SFTP during disconnect:" + error.getMessage());
				}

				try {
					if (client._session != null && client._session.isConnected()) {
						client._session.disconnect();
					}
				} catch (Exception error) {
					Log.e(LOGTAG, "Error disconnecting SSH session:" + error.getMessage());
				}

				clientPool.remove(key);
			}
		}).start();
	}`

let nextNativeModuleContents = nativeModuleContents

if (nativeModuleContents.includes(legacyDisconnectBlock)) {
	nextNativeModuleContents = nativeModuleContents.replace(
		legacyDisconnectBlock,
		patchedDisconnectBlock,
	)
}

if (
	!originalContents.includes('jcenter()') &&
	nextNativeModuleContents === nativeModuleContents
) {
	if (!originalContents.includes('mavenCentral()')) {
		throw new Error(
			`Expected mavenCentral() in ${buildGradlePath}, but it was not found.`,
		)
	}

	console.log(`SSH/SFTP dependency patches already applied: ${buildGradlePath}`)
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

if (nextNativeModuleContents !== nativeModuleContents) {
	writeFileSync(nativeModulePath, nextNativeModuleContents)
}

console.log(`Patched SSH/SFTP dependency files: ${buildGradlePath}`)
