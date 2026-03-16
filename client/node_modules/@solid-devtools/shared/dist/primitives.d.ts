import { type AnyFunction, type PrimitiveValue } from '@solid-primitives/utils';
import { type Accessor, type MemoOptions, type Setter, type SignalOptions } from 'solid-js';
export type WritableDeep<T> = 0 extends 1 & T ? T : T extends PrimitiveValue ? T : unknown extends T ? T : {
    -readonly [K in keyof T]: WritableDeep<T[K]>;
};
export declare const untrackedCallback: <Fn extends AnyFunction>(fn: Fn) => Fn;
export declare const batchedCallback: <Fn extends AnyFunction>(fn: Fn) => Fn;
export declare const useIsTouch: () => () => boolean;
export declare const useIsMobile: () => () => boolean;
export declare function createHover(handle: (hovering: boolean) => void): {
    onMouseEnter: VoidFunction;
    onMouseLeave: VoidFunction;
};
/**
 * Reactive array reducer — if at least one consumer (boolean signal) is enabled — the returned result will the `true`.
 *
 * For **IOC**
 */
export declare function createConsumers(initial?: readonly Accessor<boolean>[]): [needed: Accessor<boolean>, addConsumer: (consumer: Accessor<boolean>) => void];
export type DerivedSignal<T> = [
    value: Accessor<T>,
    setSource: (source?: Accessor<T>) => Accessor<T> | undefined
];
/**
 * For **IOC**
 */
export declare function createDerivedSignal<T>(): DerivedSignal<T>;
export declare function createDerivedSignal<T>(fallback: T, options?: MemoOptions<T>): DerivedSignal<T>;
export declare function makeHoverElementListener(onHover: (el: HTMLElement | null) => void): void;
export type Atom<T> = Accessor<T> & {
    get value(): T;
    peak(): T;
    set(value: T): T;
    update: Setter<T>;
    trigger(): void;
};
export declare function atom<T>(initialValue: T, options?: SignalOptions<T>): Atom<T>;
export declare function atom(initialValue?: undefined, options?: SignalOptions<undefined>): Atom<undefined>;
/**
 * Creates a signal that will be activated for a given amount of time on every "ping" — a call to the listener function.
 */
export declare function createPingedSignal(timeout?: number): [isUpdated: Accessor<boolean>, ping: VoidFunction];
//# sourceMappingURL=primitives.d.ts.map