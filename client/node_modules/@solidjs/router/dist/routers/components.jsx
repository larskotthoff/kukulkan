/*@refresh skip*/
import { getRequestEvent, isServer } from "solid-js/web";
import { children, createMemo, createRoot, getOwner, mergeProps, on, Show, untrack } from "solid-js";
import { createBranches, createRouteContext, createRouterContext, getIntent, getRouteMatches, RouteContextObj, RouterContextObj, setInPreloadFn } from "../routing.js";
export const createRouterComponent = (router) => (props) => {
    const { base } = props;
    const routeDefs = children(() => props.children);
    const branches = createMemo(() => createBranches(routeDefs(), props.base || ""));
    let context;
    const routerState = createRouterContext(router, branches, () => context, {
        base,
        singleFlight: props.singleFlight,
        transformUrl: props.transformUrl,
    });
    router.create && router.create(routerState);
    return (<RouterContextObj.Provider value={routerState}>
      <Root routerState={routerState} root={props.root} preload={props.rootPreload || props.rootLoad}>
        {(context = getOwner()) && null}
        <Routes routerState={routerState} branches={branches()}/>
      </Root>
    </RouterContextObj.Provider>);
};
function Root(props) {
    const location = props.routerState.location;
    const params = props.routerState.params;
    const data = createMemo(() => props.preload &&
        untrack(() => {
            setInPreloadFn(true);
            props.preload({ params, location, intent: getIntent() || "initial" });
            setInPreloadFn(false);
        }));
    return (<Show when={props.root} keyed fallback={props.children}>
      {Root => (<Root params={params} location={location} data={data()}>
          {props.children}
        </Root>)}
    </Show>);
}
function Routes(props) {
    if (isServer) {
        const e = getRequestEvent();
        if (e && e.router && e.router.dataOnly) {
            dataOnly(e, props.routerState, props.branches);
            return;
        }
        e &&
            ((e.router || (e.router = {})).matches ||
                (e.router.matches = props.routerState.matches().map(({ route, path, params }) => ({
                    path: route.originalPath,
                    pattern: route.pattern,
                    match: path,
                    params,
                    info: route.info
                }))));
    }
    const disposers = [];
    let root;
    const routeStates = createMemo(on(props.routerState.matches, (nextMatches, prevMatches, prev) => {
        let equal = prevMatches && nextMatches.length === prevMatches.length;
        const next = [];
        for (let i = 0, len = nextMatches.length; i < len; i++) {
            const prevMatch = prevMatches && prevMatches[i];
            const nextMatch = nextMatches[i];
            if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
                next[i] = prev[i];
            }
            else {
                equal = false;
                if (disposers[i]) {
                    disposers[i]();
                }
                createRoot(dispose => {
                    disposers[i] = dispose;
                    next[i] = createRouteContext(props.routerState, next[i - 1] || props.routerState.base, createOutlet(() => routeStates()[i + 1]), () => props.routerState.matches()[i]);
                });
            }
        }
        disposers.splice(nextMatches.length).forEach(dispose => dispose());
        if (prev && equal) {
            return prev;
        }
        root = next[0];
        return next;
    }));
    return createOutlet(() => routeStates() && root)();
}
const createOutlet = (child) => {
    return () => (<Show when={child()} keyed>
      {child => <RouteContextObj.Provider value={child}>{child.outlet()}</RouteContextObj.Provider>}
    </Show>);
};
export const Route = (props) => {
    const childRoutes = children(() => props.children);
    return mergeProps(props, {
        get children() {
            return childRoutes();
        }
    });
};
// for data only mode with single flight mutations
function dataOnly(event, routerState, branches) {
    const url = new URL(event.request.url);
    const prevMatches = getRouteMatches(branches, new URL(event.router.previousUrl || event.request.url).pathname);
    const matches = getRouteMatches(branches, url.pathname);
    for (let match = 0; match < matches.length; match++) {
        if (!prevMatches[match] || matches[match].route !== prevMatches[match].route)
            event.router.dataOnly = true;
        const { route, params } = matches[match];
        route.preload &&
            route.preload({
                params,
                location: routerState.location,
                intent: "preload"
            });
    }
}
