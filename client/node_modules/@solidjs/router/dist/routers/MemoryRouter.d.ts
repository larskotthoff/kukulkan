import type { LocationChange } from "../types.js";
import type { BaseRouterProps } from "./components.jsx";
import type { JSX } from "solid-js";
export type MemoryHistory = {
    get: () => string;
    set: (change: LocationChange) => void;
    go: (delta: number) => void;
    listen: (listener: (value: string) => void) => () => void;
};
export declare function createMemoryHistory(): {
    get: () => string;
    set: ({ value, scroll, replace }: LocationChange) => void;
    back: () => void;
    forward: () => void;
    go: (n: number) => void;
    listen: (listener: (value: string) => void) => () => void;
};
export type MemoryRouterProps = BaseRouterProps & {
    history?: MemoryHistory;
    actionBase?: string;
    explicitLinks?: boolean;
    preload?: boolean;
};
export declare function MemoryRouter(props: MemoryRouterProps): JSX.Element;
