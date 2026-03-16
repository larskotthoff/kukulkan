import { makeEventListener } from '@solid-primitives/event-listener';
import { createResizeObserver } from '@solid-primitives/resize-observer';
import { createDerivedStaticStore } from '@solid-primitives/static-store';
import { access } from '@solid-primitives/utils';
import { createSignal, sharedConfig, onMount, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';

// src/index.ts
var NULLED_BOUNDS = {
  top: null,
  left: null,
  bottom: null,
  right: null,
  width: null,
  height: null
};
function getElementBounds(element) {
  if (isServer || !element) {
    return { ...NULLED_BOUNDS };
  }
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height
  };
}
function createElementBounds(target, { trackMutation = true, trackResize = true, trackScroll = true } = {}) {
  if (isServer) {
    return NULLED_BOUNDS;
  }
  const isFn = typeof target === "function", [track, trigger] = createSignal(void 0, { equals: false });
  let calc;
  if (sharedConfig.context) {
    calc = () => NULLED_BOUNDS;
    onMount(() => {
      calc = () => getElementBounds(access(target));
      trigger();
    });
  } else if (isFn) {
    calc = () => getElementBounds(target());
    onMount(trigger);
  } else
    calc = () => getElementBounds(target);
  const bounds = createDerivedStaticStore(() => (track(), calc()));
  if (trackResize) {
    createResizeObserver(
      isFn ? () => target() || [] : target,
      typeof trackResize === "function" ? trackResize(trigger) : trigger
    );
  }
  if (trackScroll) {
    const scrollHandler = isFn ? (e) => {
      const el = target();
      el && e.target instanceof Node && e.target.contains(el) && trigger();
    } : (e) => e.target instanceof Node && e.target.contains(target) && trigger();
    makeEventListener(
      window,
      "scroll",
      typeof trackScroll === "function" ? trackScroll(scrollHandler) : scrollHandler,
      { capture: true }
    );
  }
  if (trackMutation) {
    const mo = new MutationObserver(
      typeof trackMutation === "function" ? trackMutation(trigger) : trigger
    );
    mo.observe(document.body, {
      attributeFilter: ["style", "class"],
      subtree: true,
      childList: true
    });
    onCleanup(() => mo.disconnect());
  }
  return bounds;
}

export { createElementBounds, getElementBounds };
