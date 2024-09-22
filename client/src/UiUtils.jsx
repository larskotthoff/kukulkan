import { createShortcut } from "@solid-primitives/keyboard";

export function mkShortcut(keys, func, preventDefault = false) {
  createShortcut(keys, (e) => {
    if(["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) === false) {
      func();
      if(preventDefault) e.preventDefault();
    }
  }, { preventDefault: false });
}

// claude wrote this specifically to work with SolidJS createShortcut
export function simulateKeyPress(key, ctrlKey = false, shiftKey = false, altKey = false) {
  const event = new KeyboardEvent('keydown', {
    key: key,
    code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
    which: key.length === 1 ? key.charCodeAt(0) : 0,
    keyCode: key.length === 1 ? key.charCodeAt(0) : 0,
    bubbles: true,
    cancelable: true,
    ctrlKey: ctrlKey,
    shiftKey: shiftKey,
    altKey: altKey
  });

  // Override readonly properties
  Object.defineProperties(event, {
    key: { value: key },
    code: { value: key.length === 1 ? `Key${key.toUpperCase()}` : key },
    which: { value: key.length === 1 ? key.charCodeAt(0) : 0 },
    keyCode: { value: key.length === 1 ? key.charCodeAt(0) : 0 }
  });

  document.dispatchEvent(event);
}

// vim: tabstop=2 shiftwidth=2 expandtab
