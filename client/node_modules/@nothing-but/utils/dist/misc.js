/** no operation */
export const noop = (() => void 0);
export const true_fn = () => true;
export const false_fn = () => false;
/** `a ^ b` */
export function xor(a, b) {
    return a ? !b : b;
}
/** Get entries of an object */
export const entries = Object.entries;
/** Get keys of an object */
export const keys = Object.keys;
/** Converts any value to an Error. */
export function toError(e) {
    return e instanceof Error ? e : new Error(String(e));
}
/** Check if a value is a PlainObject. A PlainObject is an object with no prototype. */
export const is_plain_object = (value) => (value && Object.getPrototypeOf(value) === Object.prototype);
/** Check if the value is an instance of ___ */
export const is_of_class = (v, c) => v instanceof c || (v && v.constructor === c);
/**
 * `a != null` is equivalent to `a !== null && a !== undefined`.
 *
 * Useful for filtering out `null` and `undefined` from an array.
 */
export const is_non_nullable = (i) => i != null;
/**
 * Returns a function that will call all functions in the order they were chained with the same
 * arguments.
 */
export function chain(callbacks) {
    return (...args) => {
        for (const callback of callbacks)
            callback && void callback(...args);
    };
}
/** Returns a function that will call all functions in the reversed order with the same arguments. */
export function reverse_chain(callbacks) {
    return (...args) => {
        for (let i = callbacks.length - 1; i >= 0; i--) {
            const callback = callbacks[i];
            callback && void callback(...args);
        }
    };
}
