'use strict';

var solidJs = require('solid-js');
var web = require('solid-js/web');
var utils = require('@solid-primitives/utils');

// src/index.ts
function createElementCursor(target, cursor) {
  if (web.isServer)
    return;
  solidJs.createEffect(() => {
    const el = utils.access(target);
    const cursorValue = utils.access(cursor);
    if (!el)
      return;
    const overwritten = el.style.cursor;
    el.style.setProperty("cursor", cursorValue, "important");
    solidJs.onCleanup(() => el.style.cursor = overwritten);
  });
}
function createBodyCursor(cursor) {
  if (web.isServer)
    return;
  solidJs.createEffect(() => {
    const cursorValue = cursor();
    if (!cursorValue)
      return;
    const overwritten = document.body.style.cursor;
    document.body.style.setProperty("cursor", cursorValue, "important");
    solidJs.onCleanup(() => document.body.style.cursor = overwritten);
  });
}

exports.createBodyCursor = createBodyCursor;
exports.createElementCursor = createElementCursor;
