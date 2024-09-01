import { afterEach, test, expect } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

afterEach(cleanup);

import { mkShortcut, simulateKeyPress } from "./UiUtils.jsx";

test("exports", () => {
  expect(mkShortcut).not.toBe(undefined);
  expect(simulateKeyPress).not.toBe(undefined);
});

test("mkShortcut works", async () => {
  render(() => <div/>);
  let tmp = 0;
  mkShortcut(["a"], () => tmp += 1);
  expect(tmp).toBe(0);
  await userEvent.type(document.body, "a");
  expect(tmp).toBe(1);
});

test("mkShortcut doesn't trigger inside input-likes", async () => {
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
});

// vim: tabstop=2 shiftwidth=2 expandtab
