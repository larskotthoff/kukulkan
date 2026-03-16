import * as s from 'solid-js';
import { type InspectedState, type Mapped, type OutputEmit, type ValueItemID } from '../main/types.ts';
export * from './types.ts';
export type ToggleInspectedValueData = {
    id: ValueItemID;
    selected: boolean;
};
/**
 * Plugin module
 */
export declare function createInspector(props: {
    inspectedState: s.Accessor<InspectedState>;
    enabled: s.Accessor<boolean>;
    resetInspectedNode: VoidFunction;
    emit: OutputEmit;
}): {
    getLastDetails: () => Mapped.OwnerDetails | undefined;
    toggleValueNode({ id, selected }: ToggleInspectedValueData): void;
    consoleLogValue(value_id: ValueItemID): void;
};
//# sourceMappingURL=index.d.ts.map