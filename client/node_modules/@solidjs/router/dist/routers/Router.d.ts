import type { BaseRouterProps } from "./components.jsx";
import type { JSX } from "solid-js";
export type RouterProps = BaseRouterProps & {
    url?: string;
    actionBase?: string;
    explicitLinks?: boolean;
    preload?: boolean;
};
export declare function Router(props: RouterProps): JSX.Element;
