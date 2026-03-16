import { isServer } from "solid-js/web";
export function createBeforeLeave() {
    let listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    let ignore = false;
    function confirm(to, options) {
        if (ignore)
            return !(ignore = false);
        const e = {
            to,
            options,
            defaultPrevented: false,
            preventDefault: () => (e.defaultPrevented = true)
        };
        for (const l of listeners)
            l.listener({
                ...e,
                from: l.location,
                retry: (force) => {
                    force && (ignore = true);
                    l.navigate(to, { ...options, resolve: false });
                }
            });
        return !e.defaultPrevented;
    }
    return {
        subscribe,
        confirm
    };
}
// The following supports browser initiated blocking (eg back/forward)
let depth;
export function saveCurrentDepth() {
    if (!window.history.state || window.history.state._depth == null) {
        window.history.replaceState({ ...window.history.state, _depth: window.history.length - 1 }, "");
    }
    depth = window.history.state._depth;
}
if (!isServer) {
    saveCurrentDepth();
}
export function keepDepth(state) {
    return {
        ...state,
        _depth: window.history.state && window.history.state._depth
    };
}
export function notifyIfNotBlocked(notify, block) {
    let ignore = false;
    return () => {
        const prevDepth = depth;
        saveCurrentDepth();
        const delta = prevDepth == null ? null : depth - prevDepth;
        if (ignore) {
            ignore = false;
            return;
        }
        if (delta && block(delta)) {
            ignore = true;
            window.history.go(-delta);
        }
        else {
            notify();
        }
    };
}
