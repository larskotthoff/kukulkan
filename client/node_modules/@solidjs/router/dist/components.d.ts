import type { JSX } from "solid-js";
import type { Location, Navigator } from "./types.js";
declare module "solid-js" {
    namespace JSX {
        interface AnchorHTMLAttributes<T> {
            state?: string;
            noScroll?: boolean;
            replace?: boolean;
            preload?: boolean;
            link?: boolean;
        }
    }
}
export interface AnchorProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "state"> {
    href: string;
    replace?: boolean | undefined;
    noScroll?: boolean | undefined;
    state?: unknown | undefined;
    inactiveClass?: string | undefined;
    activeClass?: string | undefined;
    end?: boolean | undefined;
}
export declare function A(props: AnchorProps): JSX.Element;
export interface NavigateProps {
    href: ((args: {
        navigate: Navigator;
        location: Location;
    }) => string) | string;
    state?: unknown;
}
export declare function Navigate(props: NavigateProps): null;
