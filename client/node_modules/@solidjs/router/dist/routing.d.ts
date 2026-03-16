import { JSX, Accessor } from "solid-js";
import type { BeforeLeaveEventArgs, Branch, Intent, Location, MatchFilters, NavigateOptions, Navigator, Params, RouteDescription, RouteContext, RouteDefinition, RouteMatch, RouterContext, RouterIntegration, SearchParams, SetSearchParams } from "./types.js";
export declare const RouterContextObj: import("solid-js").Context<RouterContext | undefined>;
export declare const RouteContextObj: import("solid-js").Context<RouteContext | undefined>;
export declare const useRouter: () => RouterContext;
export declare const useRoute: () => RouteContext;
export declare const useResolvedPath: (path: () => string) => Accessor<string | undefined>;
export declare const useHref: (to: () => string | undefined) => Accessor<string | undefined>;
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
export declare const useNavigate: () => Navigator;
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
export declare const useLocation: <S = unknown>() => Location<S>;
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
export declare const useIsRouting: () => () => boolean;
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
export declare const usePreloadRoute: () => (url: string | URL, options?: {
    preloadData?: boolean;
}) => void;
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
export declare const useMatch: <S extends string>(path: () => S, matchFilters?: MatchFilters<S>) => Accessor<import("./types.js").PathMatch | undefined>;
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
export declare const useCurrentMatches: () => () => RouteMatch[];
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
export declare const useParams: <T extends Params>() => T;
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
export declare const useSearchParams: <T extends SearchParams>() => [Partial<T>, (params: SetSearchParams, options?: Partial<NavigateOptions>) => void];
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
export declare const useBeforeLeave: (listener: (e: BeforeLeaveEventArgs) => void) => void;
export declare function createRoutes(routeDef: RouteDefinition, base?: string): RouteDescription[];
export declare function createBranch(routes: RouteDescription[], index?: number): Branch;
export declare function createBranches(routeDef: RouteDefinition | RouteDefinition[], base?: string, stack?: RouteDescription[], branches?: Branch[]): Branch[];
export declare function getRouteMatches(branches: Branch[], location: string): RouteMatch[];
export declare function getIntent(): Intent | undefined;
export declare function getInPreloadFn(): boolean;
export declare function setInPreloadFn(value: boolean): void;
export declare function createRouterContext(integration: RouterIntegration, branches: () => Branch[], getContext?: () => any, options?: {
    base?: string;
    singleFlight?: boolean;
    transformUrl?: (url: string) => string;
}): RouterContext;
export declare function createRouteContext(router: RouterContext, parent: RouteContext, outlet: () => JSX.Element, match: () => RouteMatch): RouteContext;
