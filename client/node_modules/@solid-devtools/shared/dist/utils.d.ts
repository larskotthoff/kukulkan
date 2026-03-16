export type Timeout = ReturnType<typeof setTimeout>;
export type Union<T> = {
    [K in keyof T]: UnionMember<T, K>;
}[keyof T];
export type UnionMember<T, K extends keyof T> = {
    kind: K;
    data: T[K];
};
export declare function assert(condition: any, message?: string, cause?: any): asserts condition;
export declare function msg<T, K extends keyof T>(kind: K, data: T[K]): UnionMember<T, K>;
export declare const LOG_LABEL_CYAN = "\u001B[1;30m\u001B[46msolid-devtools\u001B[0m";
export declare function info<T>(data: T): T;
export declare function log(message: string, ...args: any[]): undefined;
export declare function warn(message: string, ...args: any[]): undefined;
export declare function error(message: string, ...args: any[]): undefined;
export declare function log_message(to: string, from: string, e: {
    kind: string;
    data: any;
}): void;
export declare function formatTime(d?: Date): string;
export declare function interceptPropertySet<TObject extends object, TKey extends keyof TObject>(obj: TObject, key: TKey, cb: (value: TObject[TKey]) => void): void;
export declare const asArray: <T>(value: T) => (T extends any[] ? T[number] : T)[];
export declare const isObject: (o: unknown) => o is object;
export declare function callArrayProp<K extends PropertyKey, T extends (...args: Args) => void, Args extends unknown[]>(object: {
    [_ in K]?: T[];
}, key: K, ...args: Args): void;
export declare function pushToArrayProp<K extends PropertyKey, T>(object: {
    [_ in K]?: T[];
}, key: K, value: T): T[];
/** function that trims too long string */
export declare function trimString(str: string, maxLength: number): string;
export declare function findIndexById<T extends {
    id: string;
}>(array: T[], id: string): number;
export declare function findItemById<T extends {
    id: string;
}>(array: T[], id: string): T | undefined;
export declare const splitOnColon: <T extends string>(str: T) => T extends `${infer L}:${infer R}` ? [L, R] : [T, null];
export declare function whileArray<T, U>(toCheck: T[], callback: (item: T, toCheck: T[]) => U | undefined): U | undefined;
export type ToDyscriminatedUnion<T extends {}, TK extends PropertyKey = 'type', DK extends void | PropertyKey = void> = {
    [K in keyof T]: {
        [k in TK]: K;
    } & (DK extends PropertyKey ? {
        [k in DK]: T[K];
    } : T[K]);
}[keyof T];
export declare function dedupeArrayById<T extends {
    id: unknown;
}>(input: T[]): T[];
export declare function mutate_filter<T>(array: T[], callback: (item: T) => boolean): void;
export declare function mutate_remove<T>(array: T[], item: T): void;
//# sourceMappingURL=utils.d.ts.map