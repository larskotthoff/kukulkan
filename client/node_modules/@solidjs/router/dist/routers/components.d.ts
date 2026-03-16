import type { Component, JSX } from "solid-js";
import type { MatchFilters, RouteDefinition, RouterIntegration, RouteSectionProps, RoutePreloadFunc } from "../types.js";
export type BaseRouterProps = {
    base?: string;
    /**
     * A component that wraps the content of every route.
     */
    root?: Component<RouteSectionProps>;
    rootPreload?: RoutePreloadFunc;
    singleFlight?: boolean;
    children?: JSX.Element | RouteDefinition | RouteDefinition[];
    transformUrl?: (url: string) => string;
    /** @deprecated use rootPreload */
    rootLoad?: RoutePreloadFunc;
};
export declare const createRouterComponent: (router: RouterIntegration) => (props: BaseRouterProps) => JSX.Element;
export type RouteProps<S extends string, T = unknown> = {
    path?: S | S[];
    children?: JSX.Element;
    preload?: RoutePreloadFunc<T>;
    matchFilters?: MatchFilters<S>;
    component?: Component<RouteSectionProps<T>>;
    info?: Record<string, any>;
    /** @deprecated use preload */
    load?: RoutePreloadFunc<T>;
};
export declare const Route: <S extends string, T = unknown>(props: RouteProps<S, T>) => JSX.Element;
