import { type Solid, type ValueUpdateListener } from './types.ts';
/**
 * Runs the callback on every Solid Graph Update – whenever computations update because of a signal change.
 * The listener is automatically cleaned-up on root dispose.
 *
 * This will listen to all updates of the reactive graph — including ones outside of the <Debugger> component, and debugger internal computations.
 */
export declare function addSolidUpdateListener(onUpdate: VoidFunction): VoidFunction;
/**
 * Patches the "fn" prop of SolidComputation. Will execute the {@link onRun} callback whenever the computation is executed.
 * @param owner computation to patch
 * @param onRun execution handler
 *
 * {@link onRun} is provided with `execute()` function, and a `prev` value. `execute` is the computation handler function, it needs to be called inside {@link onRun} to calculate the next value or run side-effects.
 *
 * @example
 * ```ts
 * interceptComputationRerun(owner, (fn, prev) => {
 * 	// do something before execution
 * 	fn()
 * 	// do something after execution
 * })
 * ```
 */
export declare function interceptComputationRerun(owner: Solid.Computation, onRun: <T>(execute: () => T, prev: T) => void): void;
export declare function observeComputationUpdate(owner: Solid.Computation, onRun: VoidFunction, symbol?: symbol): void;
export declare function removeComputationUpdateObserver(owner: Solid.Computation, symbol: symbol): void;
/**
 * Patches the owner/signal value, firing the callback on each update immediately as it happened.
 */
export declare function observeValueUpdate(node: Solid.SourceMapValue | Solid.Computation, onUpdate: ValueUpdateListener, symbol: symbol): void;
export declare function removeValueUpdateObserver(node: Solid.SourceMapValue | Solid.Computation, symbol: symbol): void;
export declare function makeValueUpdateListener(node: Solid.SourceMapValue | Solid.Computation, onUpdate: ValueUpdateListener, symbol: symbol): void;
//# sourceMappingURL=observe.d.ts.map