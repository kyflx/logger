// Codes taken from https://github.com/Marak/colors.js/blob/56de9f0983f68cd0a08c5b76d10a783e4b881716/lib/styles.js
// Licensed under MIT - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

export enum Color {
	RESET = 0,

	BOLD = 1,
	DIM = 2,
	ITALIC = 3,
	UNDERLINE = 4,
	INVERSE = 7,
	HIDDEN = 8,
	STRIKETHROUGH = 9,

	BLACK = 30,
	RED = 31,
	GREEN = 32,
	YELLOW = 33,
	BLUE = 34,
	MAGENTA = 35,
	CYAN = 36,
	WHITE = 37,
	GRAY = 90,

	BRIGHT_RED = 91,
	BRIGHT_GREEN = 92,
	BRIGHT_YELLOW = 93,
	BRIGHT_BLUE = 94,
	BRIGHT_MAGENTA = 95,
	BRIGHT_CYAN = 96,
	BRIGHT_WHITE = 97,

	BG_BLACK = 40,
	BG_RED = 41,
	BG_GREEN = 42,
	BG_YELLOW = 43,
	BG_BLUE = 44,
	BG_MAGENTA = 45,
	BG_CYAN = 46,
	BG_WHITE = 47,
	BG_GRAY = 100,

	BG_BRIGHT_RED = 101,
	BG_BRIGHT_GREEN = 102,
	BG_BRIGHT_YELLOW = 103,
	BG_BRIGHT_BLUE = 104,
	BG_BRIGHT_MAGENTA = 105,
	BG_BRIGHT_CYAN = 106,
	BG_BRIGHT_WHITE = 107,
}

function getDelimiter(color: Color) {
	switch (color) {
		case Color.RESET:
			return 0;
		case Color.BOLD:
		case Color.DIM:
			return 22;
		case Color.ITALIC:
			return 23;
		case Color.UNDERLINE:
			return 24;
		case Color.INVERSE:
			return 27;
		case Color.HIDDEN:
			return 28;
		case Color.STRIKETHROUGH:
			return 29;
		case Color.BLACK:
		case Color.RED:
		case Color.GREEN:
		case Color.YELLOW:
		case Color.BLUE:
		case Color.MAGENTA:
		case Color.CYAN:
		case Color.WHITE:
		case Color.GRAY:
		case Color.BRIGHT_RED:
		case Color.BRIGHT_GREEN:
		case Color.BRIGHT_YELLOW:
		case Color.BRIGHT_BLUE:
		case Color.BRIGHT_MAGENTA:
		case Color.BRIGHT_CYAN:
		case Color.BRIGHT_WHITE:
			return 39;
		case Color.BG_BLACK:
		case Color.BG_RED:
		case Color.BG_GREEN:
		case Color.BG_YELLOW:
		case Color.BG_BLUE:
		case Color.BG_MAGENTA:
		case Color.BG_CYAN:
		case Color.BG_WHITE:
		case Color.BG_BRIGHT_RED:
		case Color.BG_BRIGHT_GREEN:
		case Color.BG_BRIGHT_YELLOW:
		case Color.BG_BRIGHT_BLUE:
		case Color.BG_BRIGHT_MAGENTA:
		case Color.BG_BRIGHT_CYAN:
		case Color.BG_BRIGHT_WHITE:
			return 49;
		default:
			throw new Error(`Cannot determine delimiter for color: ${color}`);
	}
}

export type ColorFormatterFn = (s: string) => string;

export class ColorUtil {
	private static readonly formatters: Map<Color, ColorFormatterFn> = new Map();

	public static getFormatter(color: Color): ColorFormatterFn {
		if (ColorUtil.formatters.has(color)) return ColorUtil.formatters.get(color);

		const prefix = `\u001b[${color}m`;
		const suffix = `\u001b[${getDelimiter(color)}m`;
		const formatter = (s: string) => s ? `${prefix}${s}${suffix}` : '';

		ColorUtil.formatters.set(color, formatter);

		return formatter;
	}

	public static createFormatterMap<T>(map: Map<T, Color | ColorFormatterFn>, defaults?: Map<T, Color | ColorFormatterFn>): Map<T, ColorFormatterFn> {
		const formatterMap: Map<T, ColorFormatterFn> = new Map();

		if (defaults != null) {
			ColorUtil.mergeMaps(formatterMap, defaults);
		}

		ColorUtil.mergeMaps(formatterMap, map);

		return formatterMap;
	}

	private static mergeMaps<T>(to: Map<T, ColorFormatterFn>, from: Map<T, Color | ColorFormatterFn>) {
		for (const e of from.entries()) {
			to.set(e[0], typeof e[1] === 'function' ? e[1] : ColorUtil.getFormatter(e[1]));
		}
	}
}
