import type { CacheEntry, NarrowResponse } from "../types.js";
/**
 * Revalidates the given cache entry/entries.
 */
export declare function revalidate(key?: string | string[] | void, force?: boolean): Promise<void>;
export declare function cacheKeyOp(key: string | string[] | void, fn: (cacheEntry: CacheEntry) => void): void;
export type CachedFunction<T extends (...args: any) => any> = T extends (...args: infer A) => infer R ? ([] extends {
    [K in keyof A]-?: A[K];
} ? (...args: never[]) => R extends Promise<infer P> ? Promise<NarrowResponse<P>> : NarrowResponse<R> : (...args: A) => R extends Promise<infer P> ? Promise<NarrowResponse<P>> : NarrowResponse<R>) & {
    keyFor: (...args: A) => string;
    key: string;
} : never;
export declare function query<T extends (...args: any) => any>(fn: T, name: string): CachedFunction<T>;
export declare namespace query {
    export var get: (key: string) => any;
    export var set: <T>(key: string, value: T extends Promise<any> ? never : T) => void;
    var _a: (key: string) => boolean;
    export var clear: () => void;
    export { _a as delete };
}
/** @deprecated use query instead */
export declare const cache: typeof query;
export declare function hashKey<T extends Array<any>>(args: T): string;
