import { InternalLogMeta, LOG_META_FORMATTER_MAP_SYMBOL, LogMeta } from '../util/LogMeta';

export abstract class Formatter {
	public format(meta: Readonly<InternalLogMeta>): string {
		const formatterMap = meta[LOG_META_FORMATTER_MAP_SYMBOL];

		if (formatterMap.has(this)) {
			return formatterMap.get(this);
		}

		let msg;
		if (meta.input instanceof Error) {
			msg = this.formatError(meta, meta.input);
		} else {
			msg = this.formatMessage(meta, meta.input);
		}

		formatterMap.set(this, msg);

		return msg;
	}

	protected abstract formatError(meta: Readonly<LogMeta>, error: Error): string;
	protected abstract formatMessage(meta: Readonly<LogMeta>, message: string): string;
}
