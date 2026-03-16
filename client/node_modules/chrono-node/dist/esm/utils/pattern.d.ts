type DictionaryLike = string[] | {
    [word: string]: unknown;
} | Map<string, unknown>;
export declare function repeatedTimeunitPattern(prefix: string, singleTimeunitPattern: string, connectorPattern?: string): string;
export declare function extractTerms(dictionary: DictionaryLike): string[];
export declare function matchAnyPattern(dictionary: DictionaryLike): string;
export {};
