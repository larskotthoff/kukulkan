import {
  interceptPropertySet
} from "./chunk-CSGJ6K64.js";

// packages/shared/src/detect.ts
var DATA_HYDRATION_KEY = "data-hk";
var SOLID_DEV_GLOBAL = "Solid$$";
function script_text_detect_solid(src) {
  return src.includes(`$DX_DELEGATE`) || src.includes(`getAttribute("data-hk")`) || src.includes(`getAttribute('data-hk')`) || src.includes(`hasAttribute("data-hk")`) || src.includes(`hasAttribute('data-hk')`) || src.includes(`Symbol("solid-track")`) || src.includes(`Symbol('solid-track')`);
}
function detectSolid() {
  if (document.readyState === "complete") {
    return check_for_solid();
  } else {
    return new Promise((resolve) => {
      window.addEventListener("load", () => {
        check_for_solid().then(resolve);
      });
    });
  }
}
async function check_for_solid() {
  if (detectSolidDev()) return true;
  const $hy = window._$HY;
  if ($hy && typeof $hy === "object" && "completed" in $hy && $hy.completed instanceof WeakSet)
    return true;
  if (document.querySelector("[data-hk]"))
    return true;
  const resources = performance.getEntriesByType("resource");
  for (const resource of resources) {
    if (resource.initiatorType === "script" && resource.name.startsWith(location.origin)) {
      try {
        const response = await fetch(resource.name);
        const text = await response.text();
        if (script_text_detect_solid(text)) {
          return true;
        }
      } catch (_) {
      }
    }
  }
  return false;
}
function detectSolidDev() {
  return !!window[SOLID_DEV_GLOBAL];
}
function onSolidDevDetect(callback) {
  if (detectSolidDev()) {
    queueMicrotask(callback);
  } else {
    interceptPropertySet(
      window,
      SOLID_DEV_GLOBAL,
      (value) => value && queueMicrotask(callback)
    );
  }
}
var SOLID_DEVTOOLS_GLOBAL = "SolidDevtools$$";
function detectSolidDevtools() {
  return !!window[SOLID_DEVTOOLS_GLOBAL];
}
function onSolidDevtoolsDetect(callback) {
  if (detectSolidDevtools()) {
    queueMicrotask(callback);
  } else {
    interceptPropertySet(
      window,
      SOLID_DEVTOOLS_GLOBAL,
      (value) => value && queueMicrotask(callback)
    );
  }
}
export {
  DATA_HYDRATION_KEY,
  SOLID_DEVTOOLS_GLOBAL,
  SOLID_DEV_GLOBAL,
  check_for_solid,
  detectSolid,
  detectSolidDev,
  detectSolidDevtools,
  onSolidDevDetect,
  onSolidDevtoolsDetect
};
