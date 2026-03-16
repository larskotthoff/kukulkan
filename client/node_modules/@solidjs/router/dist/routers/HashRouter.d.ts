import type { JSX } from "solid-js";
import type { BaseRouterProps } from "./components.js";
export declare function hashParser(str: string): string;
export type HashRouterProps = BaseRouterProps & {
    actionBase?: string;
    explicitLinks?: boolean;
    preload?: boolean;
};
export declare function HashRouter(props: HashRouterProps): JSX.Element;
