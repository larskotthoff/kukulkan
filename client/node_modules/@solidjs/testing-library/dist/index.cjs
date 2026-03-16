"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  cleanup: () => cleanup,
  render: () => render,
  renderDirective: () => renderDirective,
  renderHook: () => renderHook,
  testEffect: () => testEffect
});
module.exports = __toCommonJS(src_exports);
var import_dom = require("@testing-library/dom");
var import_solid_js = require("solid-js");
var import_web = require("solid-js/web");
__reExport(src_exports, require("@testing-library/dom"), module.exports);
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
  const wrappedUi = typeof wrapper === "function" ? () => (0, import_solid_js.createComponent)(wrapper, {
    get children() {
      return (0, import_solid_js.createComponent)(ui, {});
    }
  }) : ui;
  const routedUi = typeof location === "string" ? (0, import_solid_js.lazy)(async () => {
    try {
      const { createMemoryHistory, MemoryRouter } = await import("@solidjs/router");
      const history = createMemoryHistory();
      location && history.set({ value: location, scroll: false, replace: true });
      return {
        default: () => (0, import_solid_js.createComponent)(MemoryRouter, {
          history,
          get children() {
            return (0, import_solid_js.createComponent)(wrappedUi, {});
          }
        })
      };
    } catch (e) {
      console.error(
        `Error attempting to initialize @solidjs/router:
"${e instanceof Error && e.message || e?.toString() || "unknown error"}"`
      );
      return { default: () => (0, import_solid_js.createComponent)(wrappedUi, {}) };
    }
  }) : wrappedUi;
  const dispose = hydrate ? (0, import_web.hydrate)(routedUi, container) : (0, import_web.render)(routedUi, container);
  mountedContainers.add({ container, dispose });
  const queryHelpers = (0, import_dom.getQueriesForElement)(container, queries);
  return {
    asFragment: () => container?.innerHTML,
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options2) => Array.isArray(el) ? el.forEach((e) => console.log((0, import_dom.prettyDOM)(e, maxLength, options2))) : console.log((0, import_dom.prettyDOM)(el, maxLength, options2)),
    unmount: dispose,
    ...queryHelpers
  };
}
function renderHook(hook, options) {
  const initialProps = Array.isArray(options) ? options : options?.initialProps || [];
  const [dispose, owner, result] = (0, import_solid_js.createRoot)((dispose2) => {
    if (typeof options === "object" && "wrapper" in options && typeof options.wrapper === "function") {
      let result2;
      options.wrapper({
        get children() {
          return (0, import_solid_js.createComponent)(() => {
            result2 = hook(...initialProps);
            return null;
          }, {});
        }
      });
      return [dispose2, (0, import_solid_js.getOwner)(), result2];
    }
    return [dispose2, (0, import_solid_js.getOwner)(), hook(...initialProps)];
  });
  mountedContainers.add({ dispose });
  return { result, cleanup: dispose, owner };
}
function renderDirective(directive, options) {
  const [arg, setArg] = (0, import_solid_js.createSignal)(options?.initialValue);
  return Object.assign(
    render(() => {
      const targetElement = options?.targetElement && (options.targetElement instanceof HTMLElement ? options.targetElement : typeof options.targetElement === "string" ? document.createElement(options.targetElement) : typeof options.targetElement === "function" ? options.targetElement() : void 0) || document.createElement("div");
      (0, import_solid_js.onMount)(() => directive(targetElement, arg));
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
  context.dispose = (0, import_solid_js.createRoot)((dispose) => {
    (0, import_solid_js.onError)((err) => context.fail?.(err));
    (owner ? (done) => (0, import_solid_js.runWithOwner)(owner, () => fn(done)) : fn)((result) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanup,
  render,
  renderDirective,
  renderHook,
  testEffect,
  ...require("@testing-library/dom")
});
