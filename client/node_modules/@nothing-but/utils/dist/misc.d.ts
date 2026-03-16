import { AnyClass, Noop } from "./types.js";
/** no operation */
export declare const noop: Noop;
export declare const true_fn: () => boolean;
export declare const false_fn: () => boolean;
/** `a ^ b` */
export declare function xor(a: boolean, b: boolean): boolean;
/** Get entries of an object */
export declare const entries: <T extends object>(obj: T) => [keyof T, T[keyof T]][];
/** Get keys of an object */
export declare const keys: <T extends object>(object: T) => (keyof T)[];
/** Converts any value to an Error. */
export declare function toError(e: unknown): Error;
/** Check if a value is a PlainObject. A PlainObject is an object with no prototype. */
export declare const is_plain_object: (value: unknown) => value is Record<string, unknown>;
/** Check if the value is an instance of ___ */
export declare const is_of_class: (v: any, c: AnyClass) => boolean;
/**
 * `a != null` is equivalent to `a !== null && a !== undefined`.
 *
 * Useful for filtering out `null` and `undefined` from an array.
 */
export declare const is_non_nullable: <T>(i: T) => i is NonNullable<T>;
/**
 * Returns a function that will call all functions in the order they were chained with the same
 * arguments.
 */
export declare function chain<Args extends [] | any[]>(callbacks: {
    [Symbol.iterator](): IterableIterator<((...args: Args) => any) | undefined>;
}): (...args: Args) => void;
/** Returns a function that will call all functions in the reversed order with the same arguments. */
export declare function reverse_chain<Args extends [] | any[]>(callbacks: (((...args: Args) => any) | undefined)[]): (...args: Args) => void;
//# sourceMappingURL=misc.d.ts.map