import type { LocationChange, RouterContext, RouterUtils } from "../types.ts";
export declare function createRouter(config: {
    get: () => string | LocationChange;
    set: (next: LocationChange) => void;
    init?: (notify: (value?: string | LocationChange) => void) => () => void;
    create?: (router: RouterContext) => void;
    utils?: Partial<RouterUtils>;
}): (props: import("./components.jsx").BaseRouterProps) => import("solid-js").JSX.Element;
export declare function bindEvent(target: EventTarget, type: string, handler: EventListener): () => void;
export declare function scrollToHash(hash: string, fallbackTop?: boolean): void;
