import type { NodeID, Solid } from '../types.ts';
export type StoreNodeProperty = `${NodeID}:${string}`;
/**
 * - `undefined` - property deleted;
 * - `{ value: unknown }` - property updated/added;
 * - `number` - array length updated;
 */
export type StoreUpdateData = {
    value: unknown;
} | number | undefined;
export type OnNodeUpdate = (property: StoreNodeProperty, data: StoreUpdateData) => void;
export declare function setOnStoreNodeUpdate(fn: OnNodeUpdate): void;
export declare function observeStoreNode(rootNode: Solid.StoreNode): VoidFunction;
//# sourceMappingURL=store.d.ts.map