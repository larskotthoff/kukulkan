/**
 * This is mock of the eventual Solid 2.0 primitive. It is not fully featured.
 */
import { createResource, sharedConfig, untrack } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";
export function createAsync(fn, options) {
    let resource;
    let prev = () => !resource || resource.state === "unresolved" ? undefined : resource.latest;
    [resource] = createResource(() => subFetch(fn, untrack(prev)), v => v, options);
    const resultAccessor = (() => resource());
    Object.defineProperty(resultAccessor, 'latest', {
        get() {
            return resource.latest;
        }
    });
    return resultAccessor;
}
export function createAsyncStore(fn, options = {}) {
    let resource;
    let prev = () => !resource || resource.state === "unresolved" ? undefined : unwrap(resource.latest);
    [resource] = createResource(() => subFetch(fn, untrack(prev)), v => v, {
        ...options,
        storage: (init) => createDeepSignal(init, options.reconcile)
    });
    const resultAccessor = (() => resource());
    Object.defineProperty(resultAccessor, 'latest', {
        get() {
            return resource.latest;
        }
    });
    return resultAccessor;
}
function createDeepSignal(value, options) {
    const [store, setStore] = createStore({
        value: structuredClone(value)
    });
    return [
        () => store.value,
        (v) => {
            typeof v === "function" && (v = v());
            setStore("value", reconcile(structuredClone(v), options));
            return store.value;
        }
    ];
}
// mock promise while hydrating to prevent fetching
class MockPromise {
    static all() {
        return new MockPromise();
    }
    static allSettled() {
        return new MockPromise();
    }
    static any() {
        return new MockPromise();
    }
    static race() {
        return new MockPromise();
    }
    static reject() {
        return new MockPromise();
    }
    static resolve() {
        return new MockPromise();
    }
    catch() {
        return new MockPromise();
    }
    then() {
        return new MockPromise();
    }
    finally() {
        return new MockPromise();
    }
}
function subFetch(fn, prev) {
    if (isServer || !sharedConfig.context)
        return fn(prev);
    const ogFetch = fetch;
    const ogPromise = Promise;
    try {
        window.fetch = () => new MockPromise();
        Promise = MockPromise;
        return fn(prev);
    }
    finally {
        window.fetch = ogFetch;
        Promise = ogPromise;
    }
}
