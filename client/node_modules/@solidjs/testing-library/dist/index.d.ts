import { JSX, Component, Owner, Accessor, Setter } from 'solid-js';
import { Queries, queries, BoundFunctions, prettyFormat } from '@testing-library/dom';
export * from '@testing-library/dom';

type Ui = () => JSX.Element;
interface Options {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    queries?: Queries & typeof queries;
    hydrate?: boolean;
    wrapper?: Component<{
        children: JSX.Element;
    }>;
    readonly location?: string;
}
type DebugFn = (baseElement?: HTMLElement | HTMLElement[], maxLength?: number, options?: prettyFormat.OptionsReceived) => void;
type Result = BoundFunctions<typeof queries> & {
    asFragment: () => string;
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: DebugFn;
    unmount: () => void;
};
type RenderHookOptions<A extends any[]> = {
    initialProps?: A;
    wrapper?: Component<{
        children: JSX.Element;
    }>;
} | A;
type RenderHookResult<R> = {
    result: R;
    owner: Owner | null;
    cleanup: () => void;
};
type RenderDirectiveOptions<A extends any, E extends HTMLElement = HTMLDivElement> = Options & {
    initialValue?: A;
    targetElement?: Lowercase<E['nodeName']> | E | (() => E);
};
type RenderDirectiveResult<A extends any> = Result & {
    arg: Accessor<A>;
    setArg: Setter<A>;
};

/**
 * Renders a component to test it
 * @param ui {Ui} a function calling the component
 * @param options {Options} test options
 * @returns {Result} references and tools to test the component
 *
 * ```ts
 * const { getByText } = render(() => <App />, { wrapper: I18nProvider });
 * const button = getByText('Accept');
 * ```
 * ### Options
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 * - `options.location` - wraps the component in a solid-router with memory integration pointing at the given path
 *
 * ### Result
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
declare function render(ui: Ui, options?: Options): Result;
/**
 * "Renders" a hook to test it
 * @param hook {() => unknown)} a hook or primitive
 * @param options {RenderHookOptions} test options
 * @returns {RenderHookResult} references and tools to test the hook/primitive
 *
 * ```ts
 * const { result } = render(useI18n, { wrapper: I18nProvider });
 * expect(result.t('test')).toBe('works');
 * ```
 * ### Options
 * - `options.initialProps` - an array with the props that the hook will be provided with.
 * - `options.wrapper` - a component that applies a context provider and **always** returns `props.children`
 *
 * ### Result
 * - `result.result` - the return value of the hook/primitive
 * - `result.owner` - the reactive owner in which the hook is run (in order to run other reactive code in the same context with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner))
 * - `result.cleanup()` - calls the cleanup function of the hook/primitive
 */
declare function renderHook<A extends any[], R>(hook: (...args: A) => R, options?: RenderHookOptions<A>): RenderHookResult<R>;
/**
 * Applies a directive to a test container
 * @param directive {(ref, value: () => unknown)} a reusable custom directive
 * @param options {RenderDirectiveOptions} test options
 * @returns {RenderDirectiveResult} references and tools to test the directive
 *
 * ```ts
 * const called = vi.fn()
 * const { getByText, baseContainer } = render(onClickOutside, { initialValue: called });
 * expect(called).not.toBeCalled();
 * fireEvent.click(baseContainer);
 * expect(called).toBeCalled();
 * ```
 * ### Options
 * - `options.initialValue` - a value added to the directive
 * - `options.targetElement` - the name of a HTML element as a string or a HTMLElement or a function returning a HTMLElement
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 *
 * ### Result
 * - `result.arg()` - the accessor for the value that the directive receives
 * - `result.setArg()` - the setter for the value that the directive receives
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
declare function renderDirective<A extends any, U extends A, E extends HTMLElement>(directive: (ref: E, arg: Accessor<U>) => void, options?: RenderDirectiveOptions<U, E>): RenderDirectiveResult<U>;
declare function testEffect<T extends any = void>(fn: (done: (result: T) => void) => void, owner?: Owner): Promise<T>;
declare function cleanup(): void;

export { cleanup, render, renderDirective, renderHook, testEffect };
