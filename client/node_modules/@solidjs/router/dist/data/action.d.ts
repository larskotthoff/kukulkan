import { JSX } from "solid-js";
import type { Submission, SubmissionStub, NarrowResponse } from "../types.js";
export type Action<T extends Array<any>, U, V = T> = (T extends [FormData] | [] ? JSX.SerializableAttributeValue : unknown) & ((...vars: T) => Promise<NarrowResponse<U>>) & {
    url: string;
    with<A extends any[], B extends any[]>(this: (this: any, ...args: [...A, ...B]) => Promise<NarrowResponse<U>>, ...args: A): Action<B, U, V>;
};
export declare const actions: Map<string, Action<any, any, any>>;
export declare function useSubmissions<T extends Array<any>, U, V>(fn: Action<T, U, V>, filter?: (input: V) => boolean): Submission<T, NarrowResponse<U>>[] & {
    pending: boolean;
};
export declare function useSubmission<T extends Array<any>, U, V>(fn: Action<T, U, V>, filter?: (input: V) => boolean): Submission<T, NarrowResponse<U>> | SubmissionStub;
export declare function useAction<T extends Array<any>, U, V>(action: Action<T, U, V>): (...args: Parameters<Action<T, U, V>>) => Promise<NarrowResponse<U>>;
export declare function action<T extends Array<any>, U = void>(fn: (...args: T) => Promise<U>, name?: string): Action<T, U>;
export declare function action<T extends Array<any>, U = void>(fn: (...args: T) => Promise<U>, options?: {
    name?: string;
    onComplete?: (s: Submission<T, U>) => void;
}): Action<T, U>;
