import { type BaseRouterProps } from "./components.jsx";
import type { JSX } from "solid-js";
export type StaticRouterProps = BaseRouterProps & {
    url?: string;
};
export declare function StaticRouter(props: StaticRouterProps): JSX.Element;
