import { Formatter, DefaultFormatter } from "../formatter";
import { ConsoleTransport, Transport } from "../transports";

// I know global should not be used but I have no idea how to make this stuff always work without it
// If you have a better solution please make a PR
/**
 * @ignore
 */
const KEY = "__ayanaLogger__";
/**
 * @ignore
 */
declare const global: {
  __ayanaLogger__?: { [key: string]: Config };
} & NodeJS.Global;

/**
 * @ignore
 */
const VERSION: string = require("../../package.json").version;
/**
 * @ignore
 */
const MAJOR: string = VERSION.split(".")[0];

/**
 * This class is not package-safe!
 * Do not use instanceof operations in here.
 *
 * @ignore
 */
export class Config {
  public readonly version!: string;
  public readonly major!: string;

  public scopes: string[] = [];
  public paths: string[] = [];
  public scopePadding: number;
  public pathPadding: number;

  public defaultTransport = new ConsoleTransport();

  public formatter: Formatter = new DefaultFormatter();
  public transports: Array<Transport<any>> = [];

  public globalExtra: { [key: string]: any } = {};

  private constructor() {
    Object.defineProperty(this, "version", {
      configurable: false,
      writable: false,
      enumerable: true,
      value: VERSION,
    });

    Object.defineProperty(this, "major", {
      configurable: false,
      writable: false,
      enumerable: true,
      value: MAJOR,
    });

    this.transports.push(this.defaultTransport);
  }

  public addScope(scope: string) {
    this.scopes = this.scopes.concat(...[scope]);
    this.scopePadding = this.scopes.sort((a, b) => b.length - a.length)[0].length + 1;
  }

  public addPath(scope: string) {
    this.paths = this.paths.concat(...[scope])
    this.pathPadding = this.paths.sort((a, b) => b.length - a.length)[0].length;
  }

  public disableDefaultTransport() {
    if (this.defaultTransport == null) return;

    this.transports.splice(0, 1);
    this.defaultTransport = null;
  }

  public static getInstance(): Config {
    if (!global[KEY] || typeof global[KEY] !== "object") {
      global[KEY] = Object.create(null);
    }

    if (!global[KEY][MAJOR] || typeof global[KEY][MAJOR] !== "object") {
      global[KEY][MAJOR] = new Config();
    }

    const config = global[KEY][MAJOR];

    // We need to add the globalExtra object to a config created by V2.0 or V2.1
    if (config.globalExtra == null) {
      config.globalExtra = {};
    }

    return config;
  }
}
