/** Can be single or in an array */
export type Many<T> = T | T[];
export type AnyObject = Record<PropertyKey, any>;
export type EmptyObject = Record<PropertyKey, never>;
export type AnyFunction = (...args: any[]) => any;
export type Noop = (...a: any[]) => void;
export type AnyClass = abstract new (...args: any) => any;
export type Primitive = PropertyKey | boolean | bigint | null | undefined;
export type Nullish = null | undefined | void;
export type FalsyValue = false | Nullish;
export type Truthy<T> = Exclude<T, FalsyValue>;
export type Falsy<T> = Extract<T, FalsyValue>;
/** Represents a point in 2D space with x and y coordinates. */
export interface Position {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}
/** Infers the type of the array elements */
export type ItemsOf<T> = T extends any[] ? T[number] : T;
/** Allows to make shallow overwrites to an interface */
export type Modify<T, R> = Omit<T, keyof R> & R;
/** Allows to make nested overwrites to an interface */
export type ModifyDeep<A extends AnyObject, B extends DeepPartialAny<A>> = {
    [K in keyof A]: B[K] extends never ? A[K] : B[K] extends AnyObject ? ModifyDeep<A[K], B[K]> : B[K];
} & (A extends AnyObject ? Omit<B, keyof A> : A);
/**
 * Makes each property optional and turns each leaf property into any, allowing for type overrides
 * by narrowing any.
 */
export type DeepPartialAny<T> = {
    [P in keyof T]?: T[P] extends AnyObject ? DeepPartialAny<T[P]> : any;
};
/** Removes the `[...list]` functionality */
export type NonIterable<T> = T & {
    [Symbol.iterator]: never;
};
/** Get the required keys of an object */
export type RequiredKeys<T> = keyof {
    [K in keyof T as T extends {
        [_ in K]: unknown;
    } ? K : never]: 0;
};
/** `A | B => A & B` */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type ExtractIfPossible<T, U> = Extract<T, U> extends never ? U : Extract<T, U>;
/** Unwraps the type definition of an object, making it more readable */
export type Simplify<T> = T extends object ? {
    [K in keyof T]: T[K];
} : T;
/** Unboxes type definition, making it more readable */
export type UnboxLazy<T> = T extends () => infer U ? U : T;
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type RawNarrow<T> = (T extends [] ? [] : never) | (T extends string | number | bigint | boolean ? T : never) | {
    [K in keyof T]: T[K] extends Function ? T[K] : RawNarrow<T[K]>;
};
export type Narrow<T> = T extends [] ? T : RawNarrow<T>;
export type NoInfer<T> = [T][T extends any ? 0 : never];
/**
 * Enumerate<N> creates a union of numbers from 0 to N-1
 *
 * @example
 *
 * ```ts
 * Enumerate<3> // 0 | 1 | 2
 * ```
 */
export type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc["length"]]>;
/**
 * Remove the first item of a tuple
 *
 * @example
 *
 * ```ts
 * 1, 2, 3, 4 => [2, 3, 4]
 * ```
 */
export type Tail<T extends any[]> = ((...t: T) => void) extends (x: any, ...u: infer U) => void ? U : never;
/**
 * Get the first item of a tuple
 *
 * @example
 *
 * ```ts
 * 1, 2, 3, 4 => 1
 * ```
 */
export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;
/**
 * Get the last item of a tuple
 *
 * @example
 *
 * ```ts
 * 1, 2, 3, 4 => 4
 * ```
 */
export type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;
/**
 * Remove the last item of a tuple
 *
 * @example
 *
 * ```ts
 * 1, 2, 3, 4 => [1, 2, 3]
 * ```
 */
export type ButLast<T extends any[]> = T extends [...infer U, any] ? U : never;
/**
 * Exclude items from the end of a tuple that match a type
 *
 * @example
 *
 * ```ts
 * ExcludeEnd<[1, 2, 3, 4], 4> => [1, 2, 3] ExcludeEnd<[1, 2, 3, 4], 3 | 4> => [1, 2]
 * ```
 */
export type ExcludeEnd<T extends any[], U> = T extends [...infer V, U] ? ExcludeEnd<V, U> : T;
export type ExcludeVoidParams<T extends AnyFunction> = (...args: ExcludeEnd<Parameters<T>, void>) => ReturnType<T>;
export {};
//# sourceMappingURL=types.d.ts.map