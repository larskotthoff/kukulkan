'use strict';

var eventListener = require('@solid-primitives/event-listener');
var resizeObserver = require('@solid-primitives/resize-observer');
var staticStore = require('@solid-primitives/static-store');
var utils = require('@solid-primitives/utils');
var solidJs = require('solid-js');
var web = require('solid-js/web');

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
  if (web.isServer || !element) {
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
  if (web.isServer) {
    return NULLED_BOUNDS;
  }
  const isFn = typeof target === "function", [track, trigger] = solidJs.createSignal(void 0, { equals: false });
  let calc;
  if (solidJs.sharedConfig.context) {
    calc = () => NULLED_BOUNDS;
    solidJs.onMount(() => {
      calc = () => getElementBounds(utils.access(target));
      trigger();
    });
  } else if (isFn) {
    calc = () => getElementBounds(target());
    solidJs.onMount(trigger);
  } else
    calc = () => getElementBounds(target);
  const bounds = staticStore.createDerivedStaticStore(() => (track(), calc()));
  if (trackResize) {
    resizeObserver.createResizeObserver(
      isFn ? () => target() || [] : target,
      typeof trackResize === "function" ? trackResize(trigger) : trigger
    );
  }
  if (trackScroll) {
    const scrollHandler = isFn ? (e) => {
      const el = target();
      el && e.target instanceof Node && e.target.contains(el) && trigger();
    } : (e) => e.target instanceof Node && e.target.contains(target) && trigger();
    eventListener.makeEventListener(
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
    solidJs.onCleanup(() => mo.disconnect());
  }
  return bounds;
}

exports.createElementBounds = createElementBounds;
exports.getElementBounds = getElementBounds;
