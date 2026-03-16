import { type NodeID, type Solid } from '../main/types.ts';
import { NodeType } from '../types.ts';
export declare namespace SerializedDGraph {
    type Node = {
        name: string;
        depth: number;
        type: Exclude<NodeType, NodeType.Root | NodeType.Component>;
        sources: readonly NodeID[] | undefined;
        observers: readonly NodeID[] | undefined;
        graph: NodeID | undefined;
    };
    type Graph = Record<NodeID, Node>;
}
declare let OnNodeUpdate: (id: NodeID) => void;
export type OnNodeUpdate = typeof OnNodeUpdate;
export declare function collectDependencyGraph(node: Solid.Computation | Solid.Memo | Solid.Signal, config: {
    onNodeUpdate: OnNodeUpdate;
}): {
    graph: SerializedDGraph.Graph;
    clearListeners: VoidFunction;
};
export {};
//# sourceMappingURL=collect.d.ts.map