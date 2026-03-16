import { createEffect, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { access } from '@solid-primitives/utils';

// src/index.ts
function createElementCursor(target, cursor) {
  if (isServer)
    return;
  createEffect(() => {
    const el = access(target);
    const cursorValue = access(cursor);
    if (!el)
      return;
    const overwritten = el.style.cursor;
    el.style.setProperty("cursor", cursorValue, "important");
    onCleanup(() => el.style.cursor = overwritten);
  });
}
function createBodyCursor(cursor) {
  if (isServer)
    return;
  createEffect(() => {
    const cursorValue = cursor();
    if (!cursorValue)
      return;
    const overwritten = document.body.style.cursor;
    document.body.style.setProperty("cursor", cursorValue, "important");
    onCleanup(() => document.body.style.cursor = overwritten);
  });
}

export { createBodyCursor, createElementCursor };
