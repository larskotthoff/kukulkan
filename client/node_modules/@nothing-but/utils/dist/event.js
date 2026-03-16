import { onCleanup } from "./lifecycle.js";
export const PASSIVE = { passive: true };
export const NOT_PASSIVE = { passive: false };
export function preventCancelable(e) {
    if (e.cancelable)
        e.preventDefault();
    return e;
}
export function preventDefault(e) {
    e.preventDefault();
    return e;
}
export function stopPropagation(e) {
    e.stopPropagation();
    return e;
}
export function stopImmediatePropagation(e) {
    e.stopImmediatePropagation();
    return e;
}
export function preventMobileScrolling(container) {
    container.addEventListener("touchstart", preventCancelable, NOT_PASSIVE);
    container.addEventListener("touchmove", preventCancelable, NOT_PASSIVE);
}
export function ratioInElement(e, el) {
    const rect = el.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
    };
}
export function shouldIgnoreKeydown(e) {
    return e.isComposing || e.defaultPrevented || e.target !== document.body;
}
export function listener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return target.removeEventListener.bind(target, type, handler, options);
}
export function createListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    onCleanup(target.removeEventListener.bind(target, type, handler, options));
}
export function listenerMap(target, handlers, options) {
    const entries = Object.entries(handlers);
    for (const [name, handler] of entries) {
        handler && target.addEventListener(name, handler, options);
    }
    return () => {
        for (const [name, handler] of entries) {
            handler && target.removeEventListener(name, handler, options);
        }
    };
}
/** Alias to {@link listenerMap} */
export const listeners = listenerMap;
export function createListeners(target, handlers, options) {
    onCleanup(listeners(target, handlers, options));
}
