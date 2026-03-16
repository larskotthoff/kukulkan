import type { RouterContext } from "../types.js";
export declare function setupNativeEvents(preload?: boolean, explicitLinks?: boolean, actionBase?: string, transformUrl?: (url: string) => string): (router: RouterContext) => void;
