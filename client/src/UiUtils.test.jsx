import { afterEach, beforeAll, test, expect } from "vitest";
import { createRoot } from "solid-js";
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

afterEach(cleanup);

import { handleSwipe, mkShortcut } from "./UiUtils.jsx";

// claude helped with this
beforeAll(() => {
  class Touch {
    constructor(init) {
      Object.assign(this, init);
    }
  }
  global.Touch = Touch;
});

function createTouchEvent(x, y, type = 'touchstart') {
  const touch = new Touch({
    identifier: Date.now(),
    target: document.body,
    clientX: x,
    clientY: y
  });

  return new TouchEvent(type, {
    cancelable: true,
    bubbles: true,
    touches: [touch]
  });
}

test("exports", () => {
  expect(mkShortcut).not.toBe(undefined);
});

// ChatGPT helped with the setup for this
test("mkShortcut works", async () => {
  await new Promise((resolve) => {
    createRoot(async (dispose) => {
      render(() => <div/>);
      let tmp = 0;
      mkShortcut([["a"]], () => tmp += 1);
      expect(tmp).toBe(0);
      await userEvent.type(document.body, "a");
      expect(tmp).toBe(1);

      dispose();
      resolve();
    });
  });
});

test("mkShortcut doesn't trigger inside input-likes", async () => {
  await new Promise((resolve) => {
    createRoot(async (dispose) => {
      let { container } = render(() => <><input type="text"/><textarea/></>),
          tmp = 0;
      mkShortcut([["a"]], () => tmp += 1);
      expect(tmp).toBe(0);
      await userEvent.type(document.body, "a");
      expect(tmp).toBe(1);
      await userEvent.type(container.querySelector("input"), "a");
      expect(tmp).toBe(1);
      await userEvent.type(document.body, "a");
      expect(tmp).toBe(2);
      await userEvent.type(container.querySelector("textarea"), "a");
      expect(tmp).toBe(2);

      dispose();
      resolve();
    });
  });
});

test("handleSwipe works", async () => {
  let left = 0, right = 0;

  handleSwipe(document.body, () => left += 1, null, () => right += 1, null);
  expect(left).toBe(0);
  expect(right).toBe(0);

  let tt = createTouchEvent(0, 0, 'touchstart');
  // for some reason it doesn't work if this is defined in createTouchEvent
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(100, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(100, 0, 'touchend');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  expect(left).toBe(0);
  expect(right).toBe(1);

  tt = createTouchEvent(100, 0, 'touchstart');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(0, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(0, 0, 'touchend');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  expect(left).toBe(1);
  expect(right).toBe(1);
});

test("handleSwipe doesn't trigger under threshold or with vertical swipe", async () => {
  Object.defineProperty(window.screen, 'width', { value: 1024 });
  Object.defineProperty(window.screen, 'height', { value: 1024 });
  let left = 0, right = 0;

  handleSwipe(document.body, () => left += 1, null, () => right += 1, null);
  expect(left).toBe(0);
  expect(right).toBe(0);

  let tt = createTouchEvent(0, 0, 'touchstart');
  // for some reason it doesn't work if this is defined in createTouchEvent
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(20, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(20, 0, 'touchend');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  expect(left).toBe(0);
  expect(right).toBe(0);

  tt = createTouchEvent(0, 0, 'touchstart');
  // for some reason it doesn't work if this is defined in createTouchEvent
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(300, 700, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  tt = createTouchEvent(300, 700, 'touchend');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(document.body, tt);
  expect(left).toBe(0);
  expect(right).toBe(0);
});

test("handleSwipe shows indicators and adjust position of swiped element", async () => {
  Object.defineProperty(window.screen, 'width', { value: 1024 });
  const el = document.createElement("div");
  el.classList.add("thread");

  handleSwipe(el, () => 1, "leftTest", () => 1, "rightTest");

  // too little movement to adjust element position
  let tt = createTouchEvent(0, 0, 'touchstart');
  // for some reason it doesn't work if this is defined in createTouchEvent
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  tt = createTouchEvent(10, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  expect(el.style.left).toBe("");
  expect(el.children.length).toBe(0);

  // element position adjusted, no trigger shown
  tt = createTouchEvent(150, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  expect(el.style.left).toBe("150px");
  expect(el.children.length).toBe(0);

  tt = createTouchEvent(-150, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  expect(el.style.left).toBe("-150px");
  expect(el.children.length).toBe(0);

  // element position adjusted and trigger shown
  tt = createTouchEvent(350, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  expect(el.style.left).toBe("350px");
  expect(el.children.length).toBe(1);
  expect(el.children[0].innerHTML).toBe("rightTest");
  tt = createTouchEvent(350, 0, 'touchcancel');
  await fireEvent(el, tt);

  tt = createTouchEvent(0, 0, 'touchstart');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  tt = createTouchEvent(-350, 0, 'touchmove');
  tt.touches.item = (i) => tt.touches[i];
  await fireEvent(el, tt);
  expect(el.style.left).toBe("-350px");
  expect(el.children.length).toBe(1);
  expect(el.children[0].innerHTML).toBe("leftTest");
  tt = createTouchEvent(-350, 0, 'touchcancel');
  await fireEvent(el, tt);
});

// vim: tabstop=2 shiftwidth=2 expandtab
