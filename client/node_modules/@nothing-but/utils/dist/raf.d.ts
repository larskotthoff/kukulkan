export interface AnimationLoop {
    /** User callback to be called on each animation frame. */
    callback: FrameRequestCallback;
    /** {@link loopFrame} bound to this loop. */
    frame: FrameRequestCallback;
    /** The current frame id returned by {@link requestAnimationFrame}. */
    frame_id: number;
}
export declare function makeAnimationLoop(callback: FrameRequestCallback): AnimationLoop;
export declare function loopFrame(loop: AnimationLoop, time: number): void;
export declare function loopStart(loop: AnimationLoop): void;
export declare function loopClear(loop: AnimationLoop): void;
export declare const DEFAULT_TARGET_FPS = 44;
export interface FrameIterationsLimit {
    target_fps: number;
    last_timestamp: number;
}
export declare function frameIterationsLimit(target_fps?: number): FrameIterationsLimit;
export declare function calcIterations(limit: FrameIterationsLimit, current_time: number): number;
export interface AlphaUpdateSteps {
    increment: number;
    decrement: number;
}
export declare const DEFAULT_ALPHA_UPDATE_STEPS: AlphaUpdateSteps;
export declare const updateAlpha: (alpha: number, is_playing: boolean, update_steps?: AlphaUpdateSteps) => number;
export declare const DEFAULT_BUMP_TIMEOUT_DURATION = 2000;
export declare const bump: (bump_end: number, duration?: number) => number;
//# sourceMappingURL=raf.d.ts.map