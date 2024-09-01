import { afterEach, test, expect } from "vitest";
import { createRoot } from "solid-js";
import { cleanup, render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

afterEach(cleanup);

import { mkShortcut, simulateKeyPress } from "./UiUtils.jsx";

test("exports", () => {
  expect(mkShortcut).not.toBe(undefined);
  expect(simulateKeyPress).not.toBe(undefined);
});

// ChatGPT helped with the setup for this
test("mkShortcut works", async () => {
  await new Promise((resolve) => {
    createRoot(async (dispose) => {
      render(() => <div/>);
      let tmp = 0;
      mkShortcut(["a"], () => tmp += 1);
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
      mkShortcut(["a"], () => tmp += 1);
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

// vim: tabstop=2 shiftwidth=2 expandtab
