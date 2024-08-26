import { afterEach, test, expect, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

afterEach(cleanup);

import { createResource, createSignal } from "solid-js";
import { Autocomplete } from "./Autocomplete.jsx";

test("exports Autocomplete", () => {
  expect(Autocomplete).not.toBe(undefined);
});

test("sets text", () => {
  const { container } = render(() => <Autocomplete text={() => "foo"}/>);
  expect(container.querySelector("input").getAttribute("value")).toEqual("foo");
});

test("shows completions", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
});

test("shows completions with async completion function", async () => {
  global.fetch = vi.fn();
  global.fetch.mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  async function fetchSomething() {
    const response = await fetch(`blarg`);
    if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    return await response.json();
  }
  const [testText, setTestText] = createSignal(""),
        [getCompletions] = createResource(fetchSomething);

  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={getCompletions}/>);

  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");

  await vi.waitFor(() => {
    expect(screen.getByText("foo")).toBeInTheDocument();
  });
  expect(screen.getByText("foobar")).toBeInTheDocument();

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("blarg");

  vi.unstubAllGlobals();
});

test("allows to filter completions", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={(text) => ["foo", "foobar"].filter(t => t.startsWith(text))}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  await userEvent.type(input, "oob");
  expect(input.getAttribute("value")).toEqual("foob");
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
});

test("completions sorted correctly", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["afoo", "foo"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");

  const completions = document.querySelector(".MuiList-root").children;
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('afoo');
});

test("allows to complete (keyboard)", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  await userEvent.type(input, "{enter}");
  expect(input.getAttribute("value")).toEqual("foo");

  await setTestText("");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}");
  expect(input.getAttribute("value")).toEqual("foobar");
});

test("allows to complete (mouse)", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");

  let completions = document.querySelector(".MuiList-root").children;
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('foobar');

  await userEvent.click(completions[0]);
  expect(input.getAttribute("value")).toEqual("foo");

  await setTestText("");
  await userEvent.type(input, "f");
  expect(input.getAttribute("value")).toEqual("f");
  completions = document.querySelector(".MuiList-root").children;
  await userEvent.click(completions[1]);
  expect(input.getAttribute("value")).toEqual("foobar");
});

test("allows to set custom key handler", async () => {
  const [testText, setTestText] = createSignal("");
  let foo = "foo";
  expect(foo).toBe("foo");

  const { container } = render(() => <Autocomplete handleKey={() => foo = "bar"} text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(foo).toBe("bar");
});

test("allows to set select hook", async () => {
  const [testText, setTestText] = createSignal("");
  let foo = "foo";
  expect(foo).toBe("foo");

  const { container } = render(() => <Autocomplete onSelect={() => foo = "bar"} text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(foo).toBe("foo");
  let completions = document.querySelector(".MuiList-root").children;
  await userEvent.click(completions[0]);
  expect(foo).toBe("bar");

  foo = "foo";
  expect(foo).toBe("foo");
  await userEvent.type(input, "o");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}");
  expect(foo).toBe("bar");
});

// vim: tabstop=2 shiftwidth=2 expandtab
