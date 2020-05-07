import { Color, ColorFormatterFn } from '../../util';
import { LogLevel } from "../../constants"; 

export enum DefaultFormatterColor {
	/* 0 - 99  is reserved for LogLevels */

	/* 100 - 199 is for log location and timestamp */
	LOG_PACKAGE_NAME = 100,
	LOG_PID = 101,
	LOG_SCOPE = 102,
	LOG_PACKAGE_PATH = 103,
	LOG_UNIQUE_MARKER = 104,
	LOG_TIMESTAMP = 105,

	/* 200 - 299 is for error formatting */
	ERROR_CAUSED_BY = 200,
	ERROR_NAME = 201,
	ERROR_CODE = 202,
	ERROR_AT = 203,
	ERROR_TYPE_AND_FUNCTION = 204,
	ERROR_LOCATION = 205,

	/* 900 - 999 is for special bs that some "smart" devs thought was a good idea */
	ERROR_NODEJS_SOURCE_MAP_ARROW = 900,
	ERROR_NODEJS_SOURCE_MAP_LOCATION = 901,
}

export type DefaultFormatterColorKey = DefaultFormatterColor | Exclude<LogLevel, LogLevel.OFF>;

export type DefaultFormatterColorMap<V> = Map<DefaultFormatterColorKey, V>;

export const DEFAULT_FORMATTER_COLORS: DefaultFormatterColorMap<Color> = new Map([
	[LogLevel.ERROR, Color.RED],
	[LogLevel.WARN, Color.YELLOW],
	[LogLevel.INFO, Color.CYAN],
	[LogLevel.DEBUG, Color.MAGENTA],
	[LogLevel.TRACE, Color.MAGENTA],

	[DefaultFormatterColor.LOG_PACKAGE_NAME, Color.MAGENTA],
	[DefaultFormatterColor.LOG_PID, Color.MAGENTA],
	[DefaultFormatterColor.LOG_SCOPE, Color.GRAY],
	[DefaultFormatterColor.LOG_PACKAGE_PATH, Color.CYAN],
	[DefaultFormatterColor.LOG_UNIQUE_MARKER, Color.GRAY],
	[DefaultFormatterColor.LOG_TIMESTAMP, Color.GRAY],

	[DefaultFormatterColor.ERROR_CAUSED_BY, Color.BG_RED],
	[DefaultFormatterColor.ERROR_NAME, Color.UNDERLINE],
	[DefaultFormatterColor.ERROR_CODE, Color.MAGENTA],
	[DefaultFormatterColor.ERROR_AT, Color.YELLOW],
	[DefaultFormatterColor.ERROR_TYPE_AND_FUNCTION, Color.CYAN],
	[DefaultFormatterColor.ERROR_LOCATION, Color.DIM],

	[DefaultFormatterColor.ERROR_NODEJS_SOURCE_MAP_ARROW, Color.GREEN],
	[DefaultFormatterColor.ERROR_NODEJS_SOURCE_MAP_LOCATION, Color.DIM],
] as Array<[DefaultFormatterColorKey, Color]>);

export const DEFAULT_FORMATTER_COLORS_NOOP: DefaultFormatterColorMap<ColorFormatterFn> = new Map(
	Array.from(DEFAULT_FORMATTER_COLORS.keys()).map(k => [k, s => s ? s : ''])
);
