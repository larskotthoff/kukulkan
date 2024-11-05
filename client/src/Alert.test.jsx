import { afterEach, test, expect } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
afterEach(cleanup);

import { Alert } from "./Alert.jsx";

test("exports Alert", () => {
  expect(Alert).not.toBe(undefined);
});

test("sets text", () => {
  const { container } = render(() => <Alert>foo</Alert>);
  const element = container.querySelector('.alert');
  expect(element).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
});

test("success works", () => {
  const { container } = render(() => <Alert severity="success">foo</Alert>);

  const element = container.querySelector('.alert');
  expect(element).toBeDefined();
  expect(screen.getByText("foo")).toBeInTheDocument();

  expect(window.getComputedStyle(element).getPropertyValue('border'))
    .toBe('3px solid green');
  expect(screen.getByTestId("CheckCircleOutlineIcon")).toBeInTheDocument();
});

test("warning works", () => {
  const { container } = render(() => <Alert severity="warning">foo</Alert>);

  const element = container.querySelector('.alert');
  expect(element).toBeDefined();
  expect(screen.getByText("foo")).toBeInTheDocument();

  expect(window.getComputedStyle(element).getPropertyValue('border'))
    .toBe('3px solid yellow');
  expect(screen.getByTestId("WarningAmberIcon")).toBeInTheDocument();
});

test("error works", () => {
  const { container } = render(() => <Alert severity="error">foo</Alert>);

  const element = container.querySelector('.alert');
  expect(element).toBeDefined();
  expect(screen.getByText("foo")).toBeInTheDocument();

  expect(window.getComputedStyle(element).getPropertyValue('border'))
    .toBe('3px solid red');
  expect(screen.getByTestId("ErrorOutlineIcon")).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
