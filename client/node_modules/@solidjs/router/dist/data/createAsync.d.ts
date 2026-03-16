import { type ReconcileOptions } from "solid-js/store";
/**
 * As `createAsync` and `createAsyncStore` are wrappers for `createResource`,
 * this type allows to support `latest` field for these primitives.
 * It will be removed in the future.
 */
export type AccessorWithLatest<T> = {
    (): T;
    latest: T;
};
export declare function createAsync<T>(fn: (prev: T) => Promise<T>, options: {
    name?: string;
    initialValue: T;
    deferStream?: boolean;
}): AccessorWithLatest<T>;
export declare function createAsync<T>(fn: (prev: T | undefined) => Promise<T>, options?: {
    name?: string;
    initialValue?: T;
    deferStream?: boolean;
}): AccessorWithLatest<T | undefined>;
export declare function createAsyncStore<T>(fn: (prev: T) => Promise<T>, options: {
    name?: string;
    initialValue: T;
    deferStream?: boolean;
    reconcile?: ReconcileOptions;
}): AccessorWithLatest<T>;
export declare function createAsyncStore<T>(fn: (prev: T | undefined) => Promise<T>, options?: {
    name?: string;
    initialValue?: T;
    deferStream?: boolean;
    reconcile?: ReconcileOptions;
}): AccessorWithLatest<T | undefined>;
