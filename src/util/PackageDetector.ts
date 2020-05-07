import * as fs from 'fs';
import * as path from 'path';

/**
 * @ignore
 */
const CALLER_LINE_REGEX = /(?:at (?:.+?\()|at )(.+?):[0-9]+:[0-9]+/;

/**
 * @ignore
 */
export class PackageDetector {
	public readonly packageCache: Map<string, any> = new Map();

	public getRootOf(directory: string) {
		// Find the next package.json file in the directory tree
		let files = this.readdirSync(directory);
		while (!files.includes('package.json')) {
			const up = path.join(directory, '..');

			// If there is no package.json we will get stuck at the root directory
			if (up === directory) {
				directory = null;
				break;
			}

			directory = up;
			files = this.readdirSync(directory);
		}

		if (directory == null) throw new Error('No package.json could be found in the directory tree');

		return directory;
	}

	public getInfo(rootDir: string) {
		// Get package.json location
		const packageFile = path.resolve(rootDir, 'package.json');

		// Load package.json from cache or require it
		let pkg;
		if (this.packageCache.get(packageFile) == null) {
			pkg = JSON.parse(this.readFileSync(packageFile, { encoding: 'utf8' }));
			this.packageCache.set(packageFile, pkg);
		} else {
			pkg = this.packageCache.get(packageFile);
		}

		return pkg;
	}

	public getCallerFile() {
		let callerFile: string = null;
		try {
			const capture: { stack?: string } = {};
			Error.captureStackTrace(capture);
			const splitStack = capture.stack.split('\n');

			// Remove Error header
			splitStack.shift();

			// 0: Call to getCallStack(), 1: Call to getCallerDirectory(), 2: Call to our caller
			const useLine = 2;
			let currentLine = 0;
			while (currentLine < useLine) {
				// If source mapping is enabled some lines with arrows will be added which need to be removed
				if (splitStack[1]?.trimLeft().startsWith('->')) {
					splitStack.shift();
				}

				splitStack.shift();
				currentLine++;
			}

			callerFile = CALLER_LINE_REGEX.exec(splitStack[0])?.[1];
		} catch {
			// Ignore, maybe show a warning
		}

		/* istanbul ignore next */ /* This should never happen but it's handled just in case */
		if (callerFile == null) return null;

		return callerFile;
	}

	// Wrapper functions so we can test this without context

	/* istanbul ignore next */
	public readdirSync(dirPath: fs.PathLike) {
		return fs.readdirSync(dirPath);
	}

	/* istanbul ignore next */
	public readFileSync(filePath: fs.PathLike, options: { encoding: 'utf8' }): string {
		return fs.readFileSync(filePath, options);
	}
}
