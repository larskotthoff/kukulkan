import { runWithOwner, batch } from "solid-js";
import { createComponent, createContext, createMemo, createRenderEffect, createSignal, on, onCleanup, untrack, useContext, startTransition, resetErrorBoundaries } from "solid-js";
import { isServer, getRequestEvent } from "solid-js/web";
import { createBeforeLeave } from "./lifecycle.js";
import { mockBase, createMemoObject, extractSearchParams, invariant, resolvePath, createMatcher, joinPaths, scoreRoute, mergeSearchString, expandOptionals } from "./utils.js";
const MAX_REDIRECTS = 100;
export const RouterContextObj = createContext();
export const RouteContextObj = createContext();
export const useRouter = () => invariant(useContext(RouterContextObj), "<A> and 'use' router primitives can be only used inside a Route.");
let TempRoute;
export const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
export const useResolvedPath = (path) => {
    const route = useRoute();
    return createMemo(() => route.resolvePath(path()));
};
export const useHref = (to) => {
    const router = useRouter();
    return createMemo(() => {
        const to_ = to();
        return to_ !== undefined ? router.renderPath(to_) : to_;
    });
};
/**
 * Retrieves method to do navigation. The method accepts a path to navigate to and an optional object with the following options:
 *
 * - resolve (*boolean*, default `true`): resolve the path against the current route
 * - replace (*boolean*, default `false`): replace the history entry
 * - scroll (*boolean*, default `true`): scroll to top after navigation
 * - state (*any*, default `undefined`): pass custom state to `location.state`
 *
 * **Note**: The state is serialized using the structured clone algorithm which does not support all object types.
 *
 * @example
 * ```js
 * const navigate = useNavigate();
 *
 * if (unauthorized) {
 *   navigate("/login", { replace: true });
 * }
 * ```
 */
export const useNavigate = () => useRouter().navigatorFactory();
/**
 * Retrieves reactive `location` object useful for getting things like `pathname`.
 *
 * @example
 * ```js
 * const location = useLocation();
 *
 * const pathname = createMemo(() => parsePath(location.pathname));
 * ```
 */
export const useLocation = () => useRouter().location;
/**
 * Retrieves signal that indicates whether the route is currently in a *Transition*.
 * Useful for showing stale/pending state when the route resolution is *Suspended* during concurrent rendering.
 *
 * @example
 * ```js
 * const isRouting = useIsRouting();
 *
 * return (
 *   <div classList={{ "grey-out": isRouting() }}>
 *     <MyAwesomeContent />
 *   </div>
 * );
 * ```
 */
export const useIsRouting = () => useRouter().isRouting;
/**
 * usePreloadRoute returns a function that can be used to preload a route manual.
 * This is what happens automatically with link hovering and similar focus based behavior, but it is available here as an API.
 *
 * @example
 * ```js
 * const preload = usePreloadRoute();
 *
 * preload(`/users/settings`, { preloadData: true });
 * ```
 */
export const usePreloadRoute = () => {
    const pre = useRouter().preloadRoute;
    return (url, options = {}) => pre(url instanceof URL ? url : new URL(url, mockBase), options.preloadData);
};
/**
 * `useMatch` takes an accessor that returns the path and creates a `Memo` that returns match information if the current path matches the provided path.
 * Useful for determining if a given path matches the current route.
 *
 * @example
 * ```js
 * const match = useMatch(() => props.href);
 *
 * return <div classList={{ active: Boolean(match()) }} />;
 * ```
 */
export const useMatch = (path, matchFilters) => {
    const location = useLocation();
    const matchers = createMemo(() => expandOptionals(path()).map(path => createMatcher(path, undefined, matchFilters)));
    return createMemo(() => {
        for (const matcher of matchers()) {
            const match = matcher(location.pathname);
            if (match)
                return match;
        }
    });
};
/**
 * `useCurrentMatches` returns all the matches for the current matched route.
 * Useful for getting all the route information.
 *
 * @example
 * ```js
 * const matches = useCurrentMatches();
 *
 * const breadcrumbs = createMemo(() => matches().map(m => m.route.info.breadcrumb))
 * ```
 */
export const useCurrentMatches = () => useRouter().matches;
/**
 * Retrieves a reactive, store-like object containing the current route path parameters as defined in the Route.
 *
 * @example
 * ```js
 * const params = useParams();
 *
 * // fetch user based on the id path parameter
 * const [user] = createResource(() => params.id, fetchUser);
 * ```
 */
export const useParams = () => useRouter().params;
/**
 * Retrieves a tuple containing a reactive object to read the current location's query parameters and a method to update them.
 * The object is a proxy so you must access properties to subscribe to reactive updates.
 * **Note** that values will be strings and property names will retain their casing.
 *
 * The setter method accepts an object whose entries will be merged into the current query string.
 * Values `''`, `undefined` and `null` will remove the key from the resulting query string.
 * Updates will behave just like a navigation and the setter accepts the same optional second parameter as `navigate` and auto-scrolling is disabled by default.
 *
 * @examples
 * ```js
 * const [searchParams, setSearchParams] = useSearchParams();
 *
 * return (
 *   <div>
 *     <span>Page: {searchParams.page}</span>
 *     <button
 *       onClick={() =>
 *         setSearchParams({ page: (parseInt(searchParams.page) || 0) + 1 })
 *       }
 *     >
 *       Next Page
 *     </button>
 *   </div>
 * );
 * ```
 */
export const useSearchParams = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const setSearchParams = (params, options) => {
        const searchString = untrack(() => mergeSearchString(location.search, params) + location.hash);
        navigate(searchString, {
            scroll: false,
            resolve: false,
            ...options
        });
    };
    return [location.query, setSearchParams];
};
/**
 * useBeforeLeave takes a function that will be called prior to leaving a route.
 * The function will be called with:
 *
 * - from (*Location*): current location (before change).
 * - to (*string | number*): path passed to `navigate`.
 * - options (*NavigateOptions*): options passed to navigate.
 * - preventDefault (*function*): call to block the route change.
 * - defaultPrevented (*readonly boolean*): `true` if any previously called leave handlers called `preventDefault`.
 * - retry (*function*, force?: boolean ): call to retry the same navigation, perhaps after confirming with the user. Pass `true` to skip running the leave handlers again (i.e. force navigate without confirming).
 *
 * @example
 * ```js
 * useBeforeLeave((e: BeforeLeaveEventArgs) => {
 *   if (form.isDirty && !e.defaultPrevented) {
 *     // preventDefault to block immediately and prompt user async
 *     e.preventDefault();
 *     setTimeout(() => {
 *       if (window.confirm("Discard unsaved changes - are you sure?")) {
 *         // user wants to proceed anyway so retry with force=true
 *         e.retry(true);
 *       }
 *     }, 100);
 *   }
 * });
 * ```
 */
export const useBeforeLeave = (listener) => {
    const s = useRouter().beforeLeave.subscribe({
        listener,
        location: useLocation(),
        navigate: useNavigate()
    });
    onCleanup(s);
};
export function createRoutes(routeDef, base = "") {
    const { component, preload, load, children, info } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const shared = {
        key: routeDef,
        component,
        preload: preload || load,
        info
    };
    return asArray(routeDef.path).reduce((acc, originalPath) => {
        for (const expandedPath of expandOptionals(originalPath)) {
            const path = joinPaths(base, expandedPath);
            let pattern = isLeaf ? path : path.split("/*", 1)[0];
            pattern = pattern
                .split("/")
                .map((s) => {
                return s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s);
            })
                .join("/");
            acc.push({
                ...shared,
                originalPath,
                pattern,
                matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
            });
        }
        return acc;
    }, []);
}
export function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function asArray(value) {
    return Array.isArray(value) ? value : [value];
}
export function createBranches(routeDef, base = "", stack = [], branches = []) {
    const routeDefs = asArray(routeDef);
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object") {
            if (!def.hasOwnProperty("path"))
                def.path = "";
            const routes = createRoutes(def, base);
            for (const route of routes) {
                stack.push(route);
                const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
                if (def.children && !isEmptyArray) {
                    createBranches(def.children, route.pattern, stack, branches);
                }
                else {
                    const branch = createBranch([...stack], branches.length);
                    branches.push(branch);
                }
                stack.pop();
            }
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
export function getRouteMatches(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state, queryWrapper) {
    const origin = new URL(mockBase);
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin, {
        equals: (a, b) => a.href === b.href
    });
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search, true);
    const hash = createMemo(() => url().hash);
    const key = () => "";
    const queryFn = on(search, () => extractSearchParams(url()));
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: queryWrapper ? queryWrapper(queryFn) : createMemoObject(queryFn)
    };
}
let intent;
export function getIntent() {
    return intent;
}
let inPreloadFn = false;
export function getInPreloadFn() {
    return inPreloadFn;
}
export function setInPreloadFn(value) {
    inPreloadFn = value;
}
export function createRouterContext(integration, branches, getContext, options = {}) {
    const { signal: [source, setSource], utils = {} } = integration;
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const beforeLeave = utils.beforeLeave || createBeforeLeave();
    const basePath = resolvePath("", options.base || "");
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, setIsRouting] = createSignal(false);
    // Keep track of last target, so that last call to transition wins
    let lastTransitionTarget;
    // Transition the location to a new value
    const transition = (newIntent, newTarget) => {
        if (newTarget.value === reference() && newTarget.state === state())
            return;
        if (lastTransitionTarget === undefined)
            setIsRouting(true);
        intent = newIntent;
        lastTransitionTarget = newTarget;
        startTransition(() => {
            if (lastTransitionTarget !== newTarget)
                return;
            setReference(lastTransitionTarget.value);
            setState(lastTransitionTarget.state);
            resetErrorBoundaries();
            if (!isServer)
                submissions[1](subs => subs.filter(s => s.pending));
        }).finally(() => {
            if (lastTransitionTarget !== newTarget)
                return;
            // Batch, in order for isRouting and final source update to happen together
            batch(() => {
                intent = undefined;
                if (newIntent === "navigate")
                    navigateEnd(lastTransitionTarget);
                setIsRouting(false);
                lastTransitionTarget = undefined;
            });
        });
    };
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state, utils.queryWrapper);
    const referrers = [];
    const submissions = createSignal(isServer ? initFromFlash() : []);
    const matches = createMemo(() => {
        if (typeof options.transformUrl === "function") {
            return getRouteMatches(branches(), options.transformUrl(location.pathname));
        }
        return getRouteMatches(branches(), location.pathname);
    });
    const buildParams = () => {
        const m = matches();
        const params = {};
        for (let i = 0; i < m.length; i++) {
            Object.assign(params, m[i].params);
        }
        return params;
    };
    const params = utils.paramsWrapper
        ? utils.paramsWrapper(buildParams, branches)
        : createMemoObject(buildParams);
    const baseRoute = {
        pattern: basePath,
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    // Create a native transition, when source updates
    createRenderEffect(on(source, source => transition("native", source), { defer: true }));
    return {
        base: baseRoute,
        location,
        params,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory,
        matches,
        beforeLeave,
        preloadRoute,
        singleFlight: options.singleFlight === undefined ? true : options.singleFlight,
        submissions
    };
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) {
                    // A delta of 0 means stay at the current location, so it is ignored
                }
                else if (utils.go) {
                    utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const queryOnly = !to || to[0] === "?";
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: !queryOnly,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve
                ? route.resolvePath(to)
                : resolvePath((queryOnly && location.pathname) || "", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                if (isServer) {
                    const e = getRequestEvent();
                    e && (e.response = { status: 302, headers: new Headers({ Location: resolvedTo }) });
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
                else if (beforeLeave.confirm(resolvedTo, options)) {
                    referrers.push({ value: current, replace, scroll, state: state() });
                    transition("navigate", {
                        value: resolvedTo,
                        state: nextState
                    });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    function navigateEnd(next) {
        const first = referrers[0];
        if (first) {
            setSource({
                ...next,
                replace: first.replace,
                scroll: first.scroll
            });
            referrers.length = 0;
        }
    }
    function preloadRoute(url, preloadData) {
        const matches = getRouteMatches(branches(), url.pathname);
        const prevIntent = intent;
        intent = "preload";
        for (let match in matches) {
            const { route, params } = matches[match];
            route.component &&
                route.component.preload &&
                route.component.preload();
            const { preload } = route;
            inPreloadFn = true;
            preloadData &&
                preload &&
                runWithOwner(getContext(), () => preload({
                    params,
                    location: {
                        pathname: url.pathname,
                        search: url.search,
                        hash: url.hash,
                        query: extractSearchParams(url),
                        state: null,
                        key: ""
                    },
                    intent: "preload"
                }));
            inPreloadFn = false;
        }
        intent = prevIntent;
    }
    function initFromFlash() {
        const e = getRequestEvent();
        return (e && e.router && e.router.submission ? [e.router.submission] : []);
    }
}
export function createRouteContext(router, parent, outlet, match) {
    const { base, location, params } = router;
    const { pattern, component, preload } = match().route;
    const path = createMemo(() => match().path);
    component &&
        component.preload &&
        component.preload();
    inPreloadFn = true;
    const data = preload ? preload({ params, location, intent: intent || "initial" }) : undefined;
    inPreloadFn = false;
    const route = {
        parent,
        pattern,
        path,
        outlet: () => component
            ? createComponent(component, {
                params,
                location,
                data,
                get children() {
                    return outlet();
                }
            })
            : outlet(),
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    return route;
}
