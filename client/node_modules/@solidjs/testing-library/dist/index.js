// src/index.ts
import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import {
  createComponent,
  createRoot,
  createSignal,
  getOwner,
  lazy,
  onError,
  onMount,
  runWithOwner
} from "solid-js";
import { hydrate as solidHydrate, render as solidRender } from "solid-js/web";
export * from "@testing-library/dom";
if (typeof process === "undefined" || !process.env.STL_SKIP_AUTO_CLEANUP) {
  if (typeof afterEach === "function") {
    afterEach(cleanup);
  }
}
var mountedContainers = /* @__PURE__ */ new Set();
function render(ui, options = {}) {
  let { container, baseElement = container, queries, hydrate = false, wrapper, location } = options;
  if (!baseElement) {
    baseElement = document.body;
  }
  if (!container) {
    container = baseElement.appendChild(document.createElement("div"));
  }
  const wrappedUi = typeof wrapper === "function" ? () => createComponent(wrapper, {
    get children() {
      return createComponent(ui, {});
    }
  }) : ui;
  const routedUi = typeof location === "string" ? lazy(async () => {
    try {
      const { createMemoryHistory, MemoryRouter } = await import("@solidjs/router");
      const history = createMemoryHistory();
      location && history.set({ value: location, scroll: false, replace: true });
      return {
        default: () => createComponent(MemoryRouter, {
          history,
          get children() {
            return createComponent(wrappedUi, {});
          }
        })
      };
    } catch (e) {
      console.error(
        `Error attempting to initialize @solidjs/router:
"${e instanceof Error && e.message || e?.toString() || "unknown error"}"`
      );
      return { default: () => createComponent(wrappedUi, {}) };
    }
  }) : wrappedUi;
  const dispose = hydrate ? solidHydrate(routedUi, container) : solidRender(routedUi, container);
  mountedContainers.add({ container, dispose });
  const queryHelpers = getQueriesForElement(container, queries);
  return {
    asFragment: () => container?.innerHTML,
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options2) => Array.isArray(el) ? el.forEach((e) => console.log(prettyDOM(e, maxLength, options2))) : console.log(prettyDOM(el, maxLength, options2)),
    unmount: dispose,
    ...queryHelpers
  };
}
function renderHook(hook, options) {
  const initialProps = Array.isArray(options) ? options : options?.initialProps || [];
  const [dispose, owner, result] = createRoot((dispose2) => {
    if (typeof options === "object" && "wrapper" in options && typeof options.wrapper === "function") {
      let result2;
      options.wrapper({
        get children() {
          return createComponent(() => {
            result2 = hook(...initialProps);
            return null;
          }, {});
        }
      });
      return [dispose2, getOwner(), result2];
    }
    return [dispose2, getOwner(), hook(...initialProps)];
  });
  mountedContainers.add({ dispose });
  return { result, cleanup: dispose, owner };
}
function renderDirective(directive, options) {
  const [arg, setArg] = createSignal(options?.initialValue);
  return Object.assign(
    render(() => {
      const targetElement = options?.targetElement && (options.targetElement instanceof HTMLElement ? options.targetElement : typeof options.targetElement === "string" ? document.createElement(options.targetElement) : typeof options.targetElement === "function" ? options.targetElement() : void 0) || document.createElement("div");
      onMount(() => directive(targetElement, arg));
      return targetElement;
    }, options),
    { arg, setArg }
  );
}
function testEffect(fn, owner) {
  const context = {};
  context.promise = new Promise((resolve, reject) => {
    context.done = resolve;
    context.fail = reject;
  });
  context.dispose = createRoot((dispose) => {
    onError((err) => context.fail?.(err));
    (owner ? (done) => runWithOwner(owner, () => fn(done)) : fn)((result) => {
      context.done?.(result);
      dispose();
    });
    return dispose;
  });
  return context.promise;
}
function cleanupAtContainer(ref) {
  const { container, dispose } = ref;
  if (typeof dispose === "function") {
    dispose();
  } else {
    console.warn("solid-testing-library: dispose is not a function - maybe your tests include multiple solid versions!");
  }
  if (container?.parentNode === document.body) {
    document.body.removeChild(container);
  }
  mountedContainers.delete(ref);
}
function cleanup() {
  mountedContainers.forEach(cleanupAtContainer);
}
export {
  cleanup,
  render,
  renderDirective,
  renderHook,
  testEffect
};
