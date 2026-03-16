import { num } from "./index.js";
export function makeAnimationLoop(callback) {
    const loop = {
        callback: callback,
        frame: t => loopFrame(loop, t),
        frame_id: 0,
    };
    return loop;
}
export function loopFrame(loop, time) {
    loop.frame_id = requestAnimationFrame(loop.frame);
    loop.callback(time);
}
export function loopStart(loop) {
    loop.frame_id ||= requestAnimationFrame(loop.frame);
}
export function loopClear(loop) {
    cancelAnimationFrame(loop.frame_id);
    loop.frame_id = 0;
}
export const DEFAULT_TARGET_FPS = 44;
export function frameIterationsLimit(target_fps = DEFAULT_TARGET_FPS) {
    return {
        target_fps,
        last_timestamp: performance.now(),
    };
}
export function calcIterations(limit, current_time) {
    let target_ms = 1000 / limit.target_fps;
    let delta_time = current_time - limit.last_timestamp;
    let times = Math.floor(delta_time / target_ms);
    limit.last_timestamp += times * target_ms;
    return times;
}
export const DEFAULT_ALPHA_UPDATE_STEPS = {
    increment: 0.03,
    decrement: 0.005,
};
export const updateAlpha = (alpha, is_playing, update_steps = DEFAULT_ALPHA_UPDATE_STEPS) => {
    return is_playing
        ? num.lerp(alpha, 1, update_steps.increment)
        : num.lerp(alpha, 0, update_steps.decrement);
};
export const DEFAULT_BUMP_TIMEOUT_DURATION = 2000;
export const bump = (bump_end, duration = DEFAULT_BUMP_TIMEOUT_DURATION) => {
    const start = performance.now();
    const end = start + duration;
    return end > bump_end ? end : bump_end;
};
