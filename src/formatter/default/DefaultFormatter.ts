import { inspect } from 'util';

import { GenericError } from '@ayanaware/errors';

import { LogMeta,  Config,  } from '../../util';
import { Color, ColorFormatterFn, ColorUtil } from '../../util/Color';
import { Formatter } from '../Formatter';
import { LogLevel } from "../../constants"; 

import { DEFAULT_FORMATTER_COLORS, DEFAULT_FORMATTER_COLORS_NOOP, DefaultFormatterColor, DefaultFormatterColorMap } from './DefaultFormatterColor';

/**
 * @ignore
 */
const fecha = require('fecha');

/**
 * @ignore
 */
let genericError: typeof GenericError;
try {
	require.resolve('@ayanaware/errors');
	genericError = require('@ayanaware/errors').GenericError;
} catch (e) {
	// Ignore
}

/**
 * @ignore
 */
const ERROR_STACK_LINE_COLOR_REGEX = /^ {4}at (?:(.*?) (\(.*\))|(.*?))$/gm;

/**
 * @ignore
 */
const ERROR_HEADER_COLOR_REGEX = /^(?:(Caused by:) )?(\w+):* *(.*)$/gm;

/**
 * @ignore
 */
const NODEJS_SOURCE_MAPPED_LINE_COLOR_REGEX = /^ {8}-> (.*?)$/gm;

/**
 * @ignore
 */
const {
	LOG_PACKAGE_NAME,
	LOG_PID,
	LOG_SCOPE,
	LOG_PACKAGE_PATH,
	LOG_UNIQUE_MARKER,
	LOG_TIMESTAMP,
	ERROR_CAUSED_BY,
	ERROR_NAME,
	ERROR_CODE,
	ERROR_AT,
	ERROR_TYPE_AND_FUNCTION,
	ERROR_LOCATION,
	ERROR_NODEJS_SOURCE_MAP_ARROW,
	ERROR_NODEJS_SOURCE_MAP_LOCATION,
} = DefaultFormatterColor;

export interface DefaultFormatterOptions {
	dateFormat?: string;
	colorMap?: DefaultFormatterColorMap<Color | ColorFormatterFn>;
	disableDefaultColors?: boolean;
	disableErrorColors?: boolean;
}

export class DefaultFormatter extends Formatter {
	private readonly colors: DefaultFormatterColorMap<ColorFormatterFn>;
	private readonly dateFormat: string;
	private readonly disableErrorColors: boolean;

	public constructor(options?: DefaultFormatterOptions) {
		super();

		options = options || {};
		if (typeof options.dateFormat !== 'string') options.dateFormat = 'YYYY-MM-DD HH:mm:ss:SSS';
		if (typeof options.disableDefaultColors !== 'boolean') options.disableDefaultColors = false;
		if (typeof options.disableErrorColors !== 'boolean') options.disableErrorColors = false;
		options.colorMap = options.colorMap || new Map();

		this.colors = ColorUtil.createFormatterMap(options.colorMap, options.disableDefaultColors ? DEFAULT_FORMATTER_COLORS_NOOP : DEFAULT_FORMATTER_COLORS);
		this.dateFormat = options.dateFormat;
		this.disableErrorColors = options.disableErrorColors;
	}

	protected formatMessage(meta: Readonly<LogMeta>, message: string) {
		return `${this.formatTimestamp()} ${this.formatLevel(meta.level)} ${this.formatPID()} ${this.formatLoggerScope(meta.scope)} ${this.formatOrigin(meta.origin, meta.uniqueMarker)} ${ColorUtil.getFormatter(Color.GRAY)(":")} ${message}`;
	}

	protected formatTimestamp() {
		return this.colors.get(LOG_TIMESTAMP)(fecha.format(Date.now(), this.dateFormat));
	}

	protected formatLevel(level: Exclude<LogLevel, LogLevel.OFF>) {
		return this.colors.get(level)(level.padEnd(6));
	}

	protected formatPID() {
		return this.colors.get(LOG_PID)(process.pid.toString());
	}

	protected formatLoggerScope(scope: string) {
		return this.colors.get(LOG_SCOPE)(`--- [${scope.padStart(Config.getInstance().scopePadding)}]`);
	}

	protected formatPackageName(packageName: string) {
		return `${this.colors.get(LOG_PACKAGE_NAME)(packageName)}`;
	}

	protected formatPackagePath(packagePath: string, name: string) {
		return `${ packagePath || name ? ':' : '' }${this.colors.get(LOG_PACKAGE_PATH)(`${packagePath}${name}`)}`;
	}

	protected formatUniqueMarker(uniqueMarker: string) {
		return `${uniqueMarker ? ` - ${this.colors.get(LOG_UNIQUE_MARKER)(`${uniqueMarker}`)}` : ''}`;
	}

	protected formatOrigin(origin: Readonly<LogMeta['origin']>, uniqueMarker: string) {
		const path = `${this.formatPackageName(origin.packageName)}${this.formatPackagePath(origin.packagePath, origin.name)}${this.formatUniqueMarker(uniqueMarker)}`;
		Config.getInstance().addPath(path);
		return path.padEnd(Config.getInstance().pathPadding);
	}

	protected formatError(meta: Readonly<LogMeta>, error: Error): string {
		const anyError: any = error;
		const stack: string = typeof anyError?.[inspect.custom] === 'function' ? inspect(error, false, 0, false) : error.stack;

		if (this.disableErrorColors) return stack;

		const formattedStack = stack
		.replace(ERROR_STACK_LINE_COLOR_REGEX, (_, typeAndFn, location1, location2) => {
			return `    ${this.colors.get(ERROR_AT)('at')} ${this.colors.get(ERROR_TYPE_AND_FUNCTION)(typeAndFn)}${this.colors.get(ERROR_LOCATION)(location2)} ${this.colors.get(ERROR_LOCATION)(location1)}`;
		})
		.replace(NODEJS_SOURCE_MAPPED_LINE_COLOR_REGEX, (_, location) => {
			return `        ${this.colors.get(ERROR_NODEJS_SOURCE_MAP_ARROW)('->')} ${this.colors.get(ERROR_NODEJS_SOURCE_MAP_LOCATION)(location)}`;
		})
		.replace(ERROR_HEADER_COLOR_REGEX, (_, causedBy, errorName, message) => {
			let code = '';
			if (message.startsWith('(')) {
				const lastIndex: number = message.indexOf(')');
				code = message.substr(1, lastIndex - 1);
				message = message.substr(lastIndex + 1);
			}

			return `${this.colors.get(ERROR_CAUSED_BY)(causedBy)}${causedBy ? ' ' : ''}${this.colors.get(ERROR_NAME)(errorName)}: ${code ? '(' : ''}${this.colors.get(ERROR_CODE)(code)}${code ? ')' : ''}${message}`;
		});

		return this.formatMessage(meta, formattedStack);
	}
}
