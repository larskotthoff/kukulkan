/**
 * Resizes the canvas to match the size it is being displayed.
 *
 * @param   canvas the canvas to resize
 * @returns `true` if the canvas was resized
 */
export declare function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean;
export interface CanvasResizeObserver {
    /** Canvas was resized since last check. Set it to `false` to reset. */
    resized: boolean;
    canvas: HTMLCanvasElement;
    observer: ResizeObserver;
}
export declare function resizeCanvasObserver(observer: CanvasResizeObserver): boolean;
export declare function makeCanvasResizeObserver(canvas: HTMLCanvasElement): CanvasResizeObserver;
export declare function cleanCanvasResizeObserver(observer: CanvasResizeObserver): void;
//# sourceMappingURL=canvas.d.ts.map