import { afterEach, test, expect } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
afterEach(cleanup);

import { ColorChip } from "./ColorChip.jsx";

test("exports ColorChip", () => {
  expect(ColorChip).not.toBe(undefined);
});

test("sets text", () => {
  const { container } = render(() => <ColorChip value={"foo"}/>);
  const element = container.querySelector('.chip');
  expect(element).toBeInTheDocument();
});

test("sets color", () => {
  const { container } = render(() => <ColorChip value={"foo"}/>);

  const element = container.querySelector('.chip');
  expect(element).toBeDefined();
  expect(window.getComputedStyle(element).getPropertyValue('background-color'))
    .toBe('rgb(199, 5, 121)');
  expect(window.getComputedStyle(element).getPropertyValue('color'))
    .toBe('rgb(255, 255, 255)');
});

// vim: tabstop=2 shiftwidth=2 expandtab
