/**
 * Basic array-like interface. has a length and can be indexed by number.
 *
 * Can be used with {@link Array}, {@link Uint8Array}, etc.
 */
interface ArrayLike<T> {
    readonly length: number;
    readonly [Symbol.iterator]: () => IterableIterator<number>;
    [index: number]: T;
}
interface ReadonlyArrayLike<T> {
    readonly length: number;
    readonly [Symbol.iterator]: () => IterableIterator<number>;
    readonly [index: number]: T;
}
export type NumArray = ArrayLike<number>;
export type ReadonlyNumArray = ReadonlyArrayLike<number>;
/** Check shallow array equality */
export declare function equals(a: ReadonlyArrayLike<unknown>, b: ReadonlyArrayLike<unknown>): boolean;
export declare function wrap<T>(arr: readonly T[], index: number): T | undefined;
/**
 * Map an array, but only keep non-nullish values.
 *
 * Useful for combining `map` and `filter` into one operation.
 */
export declare function map_non_nullable<T, U>(array: readonly T[], fn: (item: T) => U): NonNullable<U>[];
/**
 * Checks if both arrays contain the same values. Order doesn't matter. Arrays must not contain
 * duplicates. (be the same lengths)
 */
export declare function includes_same_members(a: readonly unknown[], b: readonly unknown[]): boolean;
export declare function deduped<T>(array: readonly T[]): T[];
export declare function mutate_filter<T, S extends T>(array: T[], predicate: (value: T, index: number, array: T[]) => value is S): void;
export declare function mutate_filter<T>(array: T[], predicate: (value: T, index: number, array: T[]) => unknown): void;
export declare function unordered_remove(array: any[], idx: number): void;
export declare function remove<T>(array: T[], item: T): void;
export declare const pick_random: <T>(arr: readonly T[]) => T | undefined;
export declare function pick_random_excliding_one<T>(arr: readonly T[], excluding: T): T | undefined;
export declare function random_iterate<T>(arr: readonly T[]): Generator<T>;
/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export declare function fixedPush<T>(arr: ArrayLike<T>, value: T): void;
/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export declare function fixedPushMany<T>(arr: ArrayLike<T>, ...values: T[]): void;
/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export declare function fixedUnshift<T>(arr: ArrayLike<T>, value: T): void;
/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export declare function fixedUnshiftMany<T>(arr: ArrayLike<T>, ...values: T[]): void;
/**
 * Returns a new array with {@link top_n} top items from the given {@link arr}. The score is
 * determined by the {@link getScore} function. The returned array is sorted from highest to lowest
 * score.
 */
export declare const top_n_with: <T>(arr: readonly T[], top_n: number, getScore: (item: T) => number) => T[];
export declare function binary_search<T>(arr: readonly T[], item: T): number | undefined;
export declare function binary_search_with<T>(arr: readonly T[], item: T, get_comparable: (item: T) => number): number | undefined;
export declare function binary_insert_unique<T>(arr: T[], item: T): void;
export declare function binary_insert<T>(arr: T[], item: T): void;
export declare function binary_insert_with<T>(arr: T[], item: T, get_comparable: (item: T) => number): void;
export {};
//# sourceMappingURL=array.d.ts.map