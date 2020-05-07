import { LogLevel } from '../constants';
import { Formatter } from '../formatter';
import { Logger } from '../Logger';

/**
 * Logging metadata passed to all transports and formatters
 */
export interface LogMeta {
	/**
	 * The instance of the [[Logger]] that initiated the current logging call.
	 */
	readonly origin: Logger;
	/**
	 * The [[LogLevel]] of the message.
	 */
	readonly level: Exclude<LogLevel, LogLevel.OFF>;
	/**
	 * The optional uniqueMarker used to denote multiple instance.
	 */
  readonly uniqueMarker?: string;
  /**
   * The logger scope.
   */
  readonly scope: string;
	/**
	 * The input message. This can either be a string or an Error.
	 */
	readonly input: string | Error;
	/**
	 * An optional object of key value pairs with extra data (Can be used for a central logging system for example).
	 */
	readonly extra?: Readonly<{ [key: string]: any }>;
}

/**
 * @ignore
 */
export const LOG_META_FORMATTER_MAP_SYMBOL = Symbol('FORMATTER_MAP');

/**
 * @ignore
 */
export interface InternalLogMeta extends LogMeta {
	[LOG_META_FORMATTER_MAP_SYMBOL]: Map<Formatter, string>;
}
