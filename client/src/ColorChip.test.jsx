import { afterEach, test, expect } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
afterEach(cleanup);

import { ColorChip } from "./ColorChip.jsx";

test("exports ColorChip", () => {
  expect(ColorChip).not.toBe(undefined);
});

test("sets text", () => {
  const { container } = render(() => <ColorChip value="foo"/>);
  const element = container.querySelector('.chip');
  expect(element).toBeInTheDocument();
});

test("sets color", () => {
  const { container } = render(() => <ColorChip value="foo"/>);

  const element = container.querySelector('.chip');
  expect(element).toBeDefined();
  expect(window.getComputedStyle(element).getPropertyValue('--bg-color'))
    .toBe('#c70579');
  expect(window.getComputedStyle(element).getPropertyValue('background-color'))
    .toBe('rgba(0, 0, 0, 0)');
});

test("color based on key if present", () => {
  const { container } = render(() => <ColorChip key="foo" value="bar"/>);

  const element = container.querySelector('.chip');
  expect(element).toBeDefined();
  expect(window.getComputedStyle(element).getPropertyValue('--bg-color'))
    .toBe('#c70579');
  expect(window.getComputedStyle(element).getPropertyValue('background-color'))
    .toBe('rgba(0, 0, 0, 0)');
});

// vim: tabstop=2 shiftwidth=2 expandtab
