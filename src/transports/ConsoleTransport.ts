import * as os from 'os';

import { LogLevel, LogLevelValue } from '../constants';

import { Transport, TransportOptions } from './Transport';
import { LogMeta } from '../util';

export interface ConsoleTransportOptions extends TransportOptions {
	eol?: string;
	stderrMinLevel?: LogLevel;
}

export class ConsoleTransport extends Transport<ConsoleTransportOptions> {
	public constructor(options: ConsoleTransportOptions = {}) {
		options = {
			eol: os.EOL,
			stderrMinLevel: LogLevel.WARN,
			...options,
		};

		super(options);
	}

	public print(meta: Readonly<LogMeta>, message: string) {
		if (LogLevelValue[meta.level] > LogLevelValue[this.options.stderrMinLevel]) {
			if ((console as any)._stdout) {
				process.stdout.write(`${message}${this.options.eol}`);
			} else {
				// console.log adds a newline
				console.log(message);
			}
		} else if ((console as any)._stderr) {
			process.stderr.write(`${message}${this.options.eol}`);
		} else {
			// console.error adds a newline
			console.error(message);
		}
	}
}
