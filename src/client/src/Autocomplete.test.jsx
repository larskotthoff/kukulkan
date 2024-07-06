import { afterEach, test, expect } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
afterEach(cleanup);

import { createSignal } from "solid-js";
import { Autocomplete } from "./Autocomplete.jsx";

test("exports Autocomplete", () => {
  expect(Autocomplete).not.toBe(undefined);
});

test("sets text", () => {
  render(() => <Autocomplete text={() => "foo"}/>);
  expect(document.querySelector("input").getAttribute("value")).toEqual("foo");
})

test("shows completions", async () => {
  const [testText, setTestText] = createSignal("");
  render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = document.querySelector("input");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
})

test("allows to filter completions", async () => {
  const [testText, setTestText] = createSignal("");
  render(() => <Autocomplete text={testText} setText={setTestText} getOptions={(text) => ["foo", "foobar"].filter(t => t.startsWith(text))}/>);
  const input = document.querySelector("input");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  await user.type(input, "oob");
  expect(input.getAttribute("value")).toEqual("foob");
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
})

test("completions sorted correctly", async () => {
  const [testText, setTestText] = createSignal("");
  render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["afoo", "foo"]}/>);
  const input = document.querySelector("input");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");

  const completions = document.querySelector(".MuiList-root").children;
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('afoo');
})

test("allows to complete (keyboard)", async () => {
  const [testText, setTestText] = createSignal("");
  render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = document.querySelector("input");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  await user.type(input, "{enter}");
  expect(input.getAttribute("value")).toEqual("foo");

  await setTestText("");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  await user.type(input, "{arrowdown}");
  await user.type(input, "{enter}");
  expect(input.getAttribute("value")).toEqual("foobar");
})

test("allows to complete (mouse)", async () => {
  const [testText, setTestText] = createSignal("");
  render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = document.querySelector("input");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");

  let completions = document.querySelector(".MuiList-root").children;
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('foobar');

  await user.click(completions[0]);
  expect(input.getAttribute("value")).toEqual("foo");

  await setTestText("");
  await user.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  completions = document.querySelector(".MuiList-root").children;
  await user.click(completions[1]);
  expect(input.getAttribute("value")).toEqual("foobar");
})

// vim: tabstop=2 shiftwidth=2 expandtab
