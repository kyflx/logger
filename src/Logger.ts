import * as path from 'path';

import { Config, InternalLogMeta, PackageDetector } from './util';
import { DefaultFormatter, Formatter } from './formatter';
import { Transport } from './transports';
import { LogLevel } from "./constants"; 

/**
 * Logger main class. Use Logger.get() to create a new Logger.
 */
export class Logger {
	private static readonly detector: PackageDetector = new PackageDetector();

	/**
	 * The name of the current logger. This is derived from the argument in Logger.get().
	 */
	public readonly name: string;
	/**
	 * The package name of the current logger. This is derived from the package.json file of the caller project.
	 */
	public readonly packageName: string;
	/**
	 * The package path of the current logger. This is derived from the location Logger.get() was ran in.
	 */
  public readonly packagePath: string;
  	/**
	 * The current scope of this logger.
	 */
	public readonly scope: string;
	/**
	 * Extra data for this logger. This will be used additionally to the extra data passed in every log call.
	 */
	public readonly extra: Readonly<{ [key: string]: string }>;

	private constructor(name: string | (() => string), pkgName: string | (() => string), pkgPath: string | (() => string), scope: string | (() => string), extra: { [key: string]: string }) {
		if (typeof name === 'function') {
			Object.defineProperty(this, 'name', {
				get: name,
				configurable: false,
				enumerable: false,
			});
		} else {
			Object.defineProperty(this, 'name', {
				value: name,
				writable: false,
				configurable: false,
				enumerable: true,
			});
		}

		if (typeof pkgName === 'function') {
			Object.defineProperty(this, 'packageName', {
				get: pkgName,
				configurable: false,
				enumerable: false,
			});
		} else {
			Object.defineProperty(this, 'packageName', {
				value: pkgName,
				writable: false,
				configurable: false,
				enumerable: true,
			});
		}

		if (typeof pkgPath === 'function') {
			Object.defineProperty(this, 'packagePath', {
				get: pkgPath,
				configurable: false,
				enumerable: false,
			});
		} else {
			Object.defineProperty(this, 'packagePath', {
				value: pkgPath,
				writable: false,
				configurable: false,
				enumerable: true,
			});
    }
    
    if (typeof scope === 'function') {
			Object.defineProperty(this, 'scope', {
				get() {
          const _scope = scope();
          Config.getInstance().addScope(_scope);
          return _scope;
        },
				configurable: false,
				enumerable: false,
			});
		} else {
      Config.getInstance().addScope(scope);
			Object.defineProperty(this, 'scope', {
				value: scope,
				writable: false,
				configurable: false,
				enumerable: true,
			});
		}

		if (typeof extra !== 'object') extra = {};
		Object.defineProperty(this, 'extra', {
			value: extra,
			writable: false,
			configurable: false,
			enumerable: false,
		});
	}

	/**
	 * Logs a message with [[LogLevel]] *ERROR*
	 *
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 *
	 * @see Logger#log
	 */
	public error(log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		this.log(LogLevel.ERROR, log, uniqueMarker, extra);
	}

	/**
	 * Logs a message with [[LogLevel]] *WARN*
	 *
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 *
	 * @see Logger#log
	 */
	public warn(log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		this.log(LogLevel.WARN, log, uniqueMarker, extra);
	}

	/**
	 * Logs a message with [[LogLevel]] *INFO*
	 *
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 *
	 * @see Logger#log
	 */
	public info(log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		this.log(LogLevel.INFO, log, uniqueMarker, extra);
	}

	/**
	 * Logs a message with [[LogLevel]] *DEBUG*
	 *
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 *
	 * @see Logger#log
	 */
	public debug(log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		this.log(LogLevel.DEBUG, log, uniqueMarker, extra);
	}

	/**
	 * Logs a message with [[LogLevel]] *TRACE*
	 *
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 *
	 * @see Logger#log
	 */
	public trace(log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		this.log(LogLevel.TRACE, log, uniqueMarker, extra);
	}

	/**
	 * Logs a message.
	 *
	 * @param level The log level
	 * @param log The string or error that should be logged. This can also be a function returning a string or an error. The function will only be called if the result is acutally logged
	 * @param uniqueMarker Optional. The unique marker for denoting different instances of a class
	 * @param extra Optional. An object containing additional data that can be used later on
	 */
	public log(level: LogLevel, log: string | Error | (() => string | Error), uniqueMarker?: string, extra?: { [key: string]: any }) {
		let meta: Readonly<InternalLogMeta> = null;
		for (const transport of Config.getInstance().transports) {
			if (meta == null) meta = transport.log(this, this.scope, level, log, uniqueMarker, { ...Config.getInstance().globalExtra, ...this.extra, ...extra });
			else transport.logMeta(meta);
		}
	}

	/**
	 * Creates a new logger instance for the current context.
	 *
	 * @param name A string or a class for the loggers name.
	 * If left empty the current files name (excluding the file extension) will be used as the logger name.
	 * If set to an empty string the logger name will remain empty.
	 * @param extra Optional. An object containing additional data that will be appended on every log call
	 *
	 * @returns A new logger instance
	 */
	public static get(scope: string, name?: string | Function, extra?: { [key: string]: any }) {
		let loggerName;

		if (name == null) loggerName = null;
		else if (typeof name === 'function') loggerName = name.name;
		else if (typeof name === 'string') loggerName = name;
		else throw new Error('Logger.get(): Invalid name parameter. Pass nothing (null / undefined), a string or a named function');

		let pkgName: string = '<unknown>';
		// Relative path that gets printed in the end
		let pkgPath: string = '<unknown>';

		const callerFile = Logger.detector.getCallerFile();
		if (callerFile != null) {
			const callerDir = path.dirname(callerFile);
			const projectRoot = Logger.detector.getRootOf(callerDir);
			const pkg = Logger.detector.getInfo(projectRoot);

			let pkgMain = '';
			if (pkg.awLoggerRoot != null) pkgMain = pkg.awLoggerRoot;
			else if (pkg.main != null) pkgMain = path.dirname(pkg.main);

			// Project file root. Used as a base to find the package path
			const pkgBase = path.join(projectRoot, pkgMain);

			pkgName = pkg.name;
			pkgPath = path.relative(pkgBase, callerDir);

			if (loggerName == null) {
				loggerName = path.basename(callerFile);
				loggerName = loggerName.substr(0, loggerName.indexOf('.'));
			}
		}

		// Check path starting with . or .. which means it is not a child of the pkgBase directory
		if (pkgPath.startsWith('.')) throw new Error('Logger.get(): This file is not in the logger base path for this project');

		pkgPath = pkgPath.replace(path.sep, '.');

		if (loggerName == null) loggerName = '<unknown>';
		if (pkgPath.length > 0 && loggerName !== '') pkgPath = `${pkgPath}.`;

		return new Logger(loggerName, pkgName, pkgPath, scope, extra);
	}

	/**
	 * Creates a new custom logger instance without running any package detection.
	 * The first three arguments can also be functions returning the specified value so they can be changed.
	 * The functions will be called for every log-call.
	 *
	 * @param name The loggers name
	 * @param packageName The loggers package name
	 * @param packagePath The loggers package path (This should to end with a "." if it's not empty so it looks correct)
	 * @param extra Optional. An object containing additional data that will be appended on every log call
	 *
	 * @returns A new logger instance
	 */
	public static custom(name: string | (() => string), packageName: string | (() => string), packagePath: string | (() => string), scope: string | (() => string), extra?: { [key: string]: any }) {
		return new Logger(name, packageName, packagePath, scope, extra);
	}

	/**
	 * Changes the global formatter.
	 * Note that this will affect every transport not explicitly defining their own formatter.
	 * If you want to only change the formatter on the default transport use `Logger.getDefaultTransport().setFormatter()`.
	 * The formatter must extend the class [[Formatter]].
	 * Alternatively `null` can be passed to reset the global formatter to the [[DefaultFormatter]].
	 *
	 * @param formatter The new global formatter
	 */
	public static setFormatter(formatter: Formatter) {
		// Reset to default formatter if null or undefined is given
		if (formatter == null) formatter = new DefaultFormatter();

		// Check instance
		if (!(formatter instanceof Formatter)) throw new Error('Invalid formatter');

		Config.getInstance().formatter = formatter;
	}

	/**
	 * Adds a new transport.
	 * Note that the transport will get all logging data from every installed module that uses this logging library.
	 * The transport must extend the class [[Transport]].
	 *
	 * @param transport The transport to be added
	 */
	public static addTransport(transport: Transport<any>) {
		if (transport == null) return;

		if (!(transport instanceof Transport)) throw new Error('Invalid transport');

		Config.getInstance().transports.push(transport);
	}

	/**
	 * Returns the default [[ConsoleTransport]] or null if the default transport has been disabled.
	 *
	 * @returns The default [[ConsoleTransport]]
	 */
	public static getDefaultTransport() {
		return Config.getInstance().defaultTransport;
	}

	/**
	 * Disables the default [[ConsoleTransport]].
	 * Note that calling this will affect every installed module that uses this logging library.
	 */
	public static disableDefaultTransport() {
		Config.getInstance().disableDefaultTransport();
	}

	/**
	 * Sets the global extra object applied to every log call.
	 *
	 * @param extra The global extra object
	 */
	public static setGlobalExtra(extra: { [key: string]: any }) {
		if (typeof extra !== 'object') extra = {};

		Config.getInstance().globalExtra = extra;
	}

	/**
	 * Returns the current global extra object.
	 *
	 * @returns The current global extra object
	 */
	public static getGlobalExtra(): Readonly<{ [key: string]: any }> {
		return Config.getInstance().globalExtra;
	}

	/**
	 * Returns the version major of this package.
	 * This is used by @ayana/logger-api to determine compatibility.
	 *
	 * @returns The version major of this package.
	 */
	public static getVersionMajor(): number {
		return Number(Config.getInstance().major);
	}
}
