import { Config } from '../util/Config';
import { LogLevel, LogLevelValue } from '../constants';
import { Formatter } from '../formatter';
import { Logger } from '../Logger';
import { InternalLogMeta, LOG_META_FORMATTER_MAP_SYMBOL, LogMeta } from '../util/LogMeta';

export interface TransportOptionsLogger {
	name: string;
	level: LogLevel;
	exact?: boolean;
}

export interface TransportOptions {
	formatter?: Formatter;
	level?: LogLevel;
	loggers?: Array<TransportOptionsLogger>;
}

export abstract class Transport<T extends TransportOptions> {
	private readonly knownLoggers: Map<Logger, LogLevelValue> = new Map();

	protected readonly options: T = {} as T;

	public constructor(options?: T) {
		this.options = { ...(options || {} as T) };

		this.setLevel(options.level);
		this.setFormatter(options.formatter);
		this.setLoggers(options.loggers);
	}

	public setLevel(level: LogLevel) {
		if (level == null) level = LogLevel.INFO;

		this.options.level = level;

		this.knownLoggers.clear();
	}

	public setFormatter(formatter: Formatter) {
		// Reset to default formatter if null or undefined is given
		if (formatter == null) {
			Object.defineProperty(this.options, 'formatter', {
				get: Transport.defaultFormatterGetter,
			});

			return;
		}

		// Check instance
		if (!(formatter instanceof Formatter)) throw new Error('Invalid formatter');

		this.options.formatter = formatter;
	}

	public setLoggers(loggers: Array<TransportOptionsLogger>) {
		// Deep clone loggers so no further changes can be made
		if (Array.isArray(loggers)) {
			loggers = JSON.parse(JSON.stringify(loggers));
		} else {
			loggers = [];
		}

		this.options.loggers = loggers;

		this.knownLoggers.clear();
	}

	private getAllowedLevel(logger: Logger): LogLevelValue {
		if (this.knownLoggers.has(logger)) return this.knownLoggers.get(logger);

		let allowLevel = LogLevelValue[this.options.level];

		const identifier = `${logger.packageName}:${logger.packagePath}${logger.name}`;
		for (const log of this.options.loggers) {
			if (log.exact && identifier !== log.name) continue;
			if (!log.exact && !identifier.startsWith(log.name)) continue;

			if (log.level === LogLevel.OFF) {
				allowLevel = LogLevelValue.OFF;
				break;
			}

			allowLevel = LogLevelValue[log.level];
			break;
		}

		this.knownLoggers.set(logger, allowLevel);

		return allowLevel;
	}

	// tslint:disable-next-line: parameters-max-number
	public log(origin: Logger, scope: string, level: LogLevel, input: string | Error | (() => string | Error), uniqueMarker?: string, extra?: Readonly<{ [key: string]: any }>): Readonly<InternalLogMeta> {
		const allowLevel = this.getAllowedLevel(origin);

		if (allowLevel === LogLevelValue.OFF || level === LogLevel.OFF) return null;
		if (LogLevelValue[level] > allowLevel) return null;

		if (typeof input === 'function') input = input();

		const meta: InternalLogMeta = {
			origin,
			level,
			uniqueMarker,
			input,
			extra,
			scope,
			[LOG_META_FORMATTER_MAP_SYMBOL]: new Map(),
		};

		this.formatAndPrint(meta);

		return meta;
	}

	public logMeta(meta: Readonly<InternalLogMeta>) {
		const allowLevel = this.getAllowedLevel(meta.origin);
		if (allowLevel === LogLevelValue.OFF) return;

		this.formatAndPrint(meta);
	}

	private formatAndPrint(meta: Readonly<InternalLogMeta>) {
		this.print(meta, this.options.formatter.format(meta));
	}

	private static defaultFormatterGetter() {
		return Config.getInstance().formatter;
	}

	protected abstract print(meta: Readonly<LogMeta>, message: string): void;
}
