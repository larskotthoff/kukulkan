import { type NodeID, type Solid } from './types.ts';
/**
 * a fake root for collecting signals used top-level
 */
export declare const UNOWNED_ROOT: Solid.Root;
export declare const getCurrentRoots: () => Iterable<Solid.Root>;
declare let OnOwnerNeedsUpdate: ((owner: Solid.Owner, rootId: NodeID) => void) | undefined;
/** Listens to owners that have their structure changed, because of roots */
export declare function setOnOwnerNeedsUpdate(fn: typeof OnOwnerNeedsUpdate): void;
declare let OnRootRemoved: ((rootId: NodeID) => void) | undefined;
/** Listens to roots that were removed */
export declare function setOnRootRemoved(fn: typeof OnRootRemoved): void;
export declare function createTopRoot(owner: Solid.Root): void;
/**
 * Helps the debugger find and reattach an reactive owner created by `createRoot` to it's detached parent.
 *
 * Call this synchronously inside `createRoot` callback body, whenever you are using `createRoot` yourself to dispose of computations early, or inside `<For>`/`<Index>` components to reattach their children to reactive graph visible by the devtools debugger.
 * @example
 * createRoot(dispose => {
 * 	// This reactive Owner disapears form the owner tree
 *
 * 	// Reattach the Owner to the tree:
 * 	attachDebugger();
 * });
 */
export declare function attachDebugger(owner?: import("solid-js").Owner | null): void;
export declare function initRoots(): void;
/**
 * Finds the top-level root owner of a given owner.
 */
export declare function getTopRoot(owner: Solid.Owner): Solid.Root | null;
/**
 * Searches for the closest alive parent of the given owner.
 * A parent here consists of `{ owner: SolidOwner; root: SolidRoot }` where `owner` is the closest tree node to attach to, and `root` in the closest subroot/root that is not disposed.
 * @param owner
 * @returns `{ owner: SolidOwner; root: SolidRoot }`
 */
export declare function findClosestAliveParent(owner: Solid.Owner): {
    owner: Solid.Owner;
    root: Solid.Root;
} | {
    owner: null;
    root: null;
};
export {};
//# sourceMappingURL=roots.d.ts.map