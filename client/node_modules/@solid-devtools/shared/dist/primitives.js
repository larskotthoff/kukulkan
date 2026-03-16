// packages/shared/src/primitives.ts
import { makeEventListener } from "@solid-primitives/event-listener";
import { createMediaQuery } from "@solid-primitives/media";
import { createSingletonRoot } from "@solid-primitives/rootless";
import { tryOnCleanup } from "@solid-primitives/utils";
import {
  batch,
  createMemo,
  createSignal,
  equalFn,
  getOwner,
  onCleanup,
  untrack
} from "solid-js";
var untrackedCallback = (fn) => (...a) => untrack(fn.bind(void 0, ...a));
var batchedCallback = (fn) => (...a) => batch(fn.bind(void 0, ...a));
var useIsTouch = createSingletonRoot(() => createMediaQuery("(hover: none)"));
var useIsMobile = createSingletonRoot(() => createMediaQuery("(max-width: 640px)"));
function createHover(handle) {
  let state = false;
  let mounted = true;
  const mql = window.matchMedia("(hover: none)");
  let is_touch = mql.matches;
  makeEventListener(mql, "change", (e) => {
    if (is_touch = e.matches) {
      handle(state = false);
    }
  });
  onCleanup(() => {
    mounted = false;
    if (state) handle(state = false);
  });
  const onChange = (new_state) => {
    if (!is_touch && mounted && state !== new_state) {
      handle(state = new_state);
    }
  };
  return {
    onMouseEnter: () => onChange(true),
    onMouseLeave: () => setTimeout(() => onChange(false))
  };
}
function createConsumers(initial = []) {
  const [consumers, setConsumers] = createSignal([...initial], { name: "consumers" });
  const enabled = createMemo(() => consumers().some((consumer) => consumer()));
  return [
    enabled,
    (consumer) => {
      setConsumers((p) => [...p, consumer]);
      tryOnCleanup(() => setConsumers((p) => p.filter((c) => c !== consumer)));
    }
  ];
}
function createDerivedSignal(fallback, options) {
  const [source, setSource] = createSignal();
  return [
    createMemo(
      () => {
        const sourceRef = source();
        return sourceRef ? sourceRef() : fallback;
      },
      void 0,
      options
    ),
    (newSource) => {
      if (newSource && getOwner())
        onCleanup(() => setSource((p) => p === newSource ? void 0 : p));
      return setSource(() => newSource);
    }
  ];
}
function makeHoverElementListener(onHover) {
  let last = null;
  const handleHover = (e) => {
    const { target } = e;
    if (target === last || !(target instanceof HTMLElement) && target !== null) return;
    onHover(last = target);
  };
  makeEventListener(window, "mouseover", handleHover);
  makeEventListener(document, "mouseleave", handleHover.bind(void 0, { target: null }));
}
function atom(initialValue, options) {
  let mutating = false;
  const equals = (options?.equals ?? equalFn) || (() => false);
  const [atom2, setter] = createSignal(initialValue, {
    ...options,
    equals: (a, b) => mutating ? mutating = false : equals(a, b)
  });
  atom2.update = setter;
  atom2.trigger = () => {
    mutating = true;
    setter((p) => p);
  };
  atom2.set = (value) => setter(() => value);
  atom2.peak = untrack.bind(void 0, atom2);
  Object.defineProperty(atom2, "value", { get: atom2 });
  return atom2;
}
function createPingedSignal(timeout = 400) {
  const [isUpdated, setIsUpdated] = createSignal(false);
  let timeoutId;
  const ping = () => {
    setIsUpdated(true);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setIsUpdated(false), timeout);
  };
  onCleanup(() => clearTimeout(timeoutId));
  return [isUpdated, ping];
}
export {
  atom,
  batchedCallback,
  createConsumers,
  createDerivedSignal,
  createHover,
  createPingedSignal,
  makeHoverElementListener,
  untrackedCallback,
  useIsMobile,
  useIsTouch
};
