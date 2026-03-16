import { BeforeLeaveLifecycle, LocationChange } from "./types.js";
export declare function createBeforeLeave(): BeforeLeaveLifecycle;
export declare function saveCurrentDepth(): void;
export declare function keepDepth(state: any): any;
export declare function notifyIfNotBlocked(notify: (value?: string | LocationChange) => void, block: (delta: number | null) => boolean): () => void;
