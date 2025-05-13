import { afterEach, test, expect, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

afterEach(cleanup);

import { createResource, createSignal } from "solid-js";
import { Autocomplete, ChipComplete, getTagOptions, TagComplete } from "./Autocomplete.jsx";

test("exports Autocomplete, ChipComplete, TagComplete", () => {
  expect(Autocomplete).not.toBe(undefined);
  expect(ChipComplete).not.toBe(undefined);
  expect(TagComplete).not.toBe(undefined);
  expect(getTagOptions).not.toBe(undefined);
});

test("sets text", () => {
  const { container } = render(() => <Autocomplete text={() => "foo"}/>);
  expect(container.querySelector("input").value).toEqual("foo");
});

test("shows completions", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
});

test("shows completions with async completion function", async () => {
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "blarg":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
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
  expect(input.value).toEqual("f");

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
  expect(input.value).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  await userEvent.type(input, "oob");
  expect(input.value).toEqual("foob");
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
});

test("completions sorted correctly", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText}
    getOptions={() => ["afoo", "foo", "bar", "bar@foo.com", "foo@bar.com", "bar foo"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");

  const completions = document.querySelector(".autocomplete-popup").children;
  expect(completions[0]).toHaveTextContent("foo");
  expect(completions[1]).toHaveTextContent("foo@bar.com");
  expect(completions[2]).toHaveTextContent("bar foo");
  expect(completions[3]).toHaveTextContent("bar@foo.com");
  expect(completions[4]).toHaveTextContent("afoo");
  expect(completions[5]).toHaveTextContent("bar");
});

test("allows to complete (keyboard)", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  await userEvent.type(input, "{enter}");
  expect(input.value).toEqual("foo");

  await setTestText("");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}");
  expect(input.value).toEqual("foobar");
});

test("allows to complete (mouse)", async () => {
  const [testText, setTestText] = createSignal("");
  const { container } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");

  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('foobar');

  await userEvent.click(completions[0]);
  expect(input.value).toEqual("foo");

  await setTestText("");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  completions = document.querySelector(".autocomplete-popup").children;
  await userEvent.click(completions[1]);
  expect(input.value).toEqual("foobar");
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

test("ChipComplete works with enter", async () => {
  let chips = ["foo", "test"],
      add = "", remove = "";
  const { container } = render(() =>
    <ChipComplete chips={chips} getOptions={() => ["foobar"]}
      addChip={(t) => add = t} removeChip={(t) => remove = t}/>);

  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(remove).toBe("");
  await userEvent.click(screen.getByText("foo"));
  expect(remove).toBe("foo");

  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  const completions = document.querySelector(".autocomplete-popup").children;
  expect(completions[0]).toHaveTextContent('foobar');

  expect(add).toBe("");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe("foobar");
});

test("TagComplete works", async () => {
  let tags = ["foo", "test"],
      add = "", remove = "";
  vi.stubGlobal("data", { "allTags": tags.concat("foobar") });
  const { container } = render(() =>
    <TagComplete tags={tags} addTag={(t) => add = t}
      removeTag={(t) => remove = t}/>);

  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(remove).toBe("");
  await userEvent.click(screen.getByText("foo"));
  expect(remove).toBe("foo");

  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent('foo');
  expect(completions[1]).toHaveTextContent('foobar');

  expect(add).toBe("");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe("foobar");

  await userEvent.type(input, "b");
  expect(input.value).toEqual("b");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(1);
  expect(completions[0]).toHaveTextContent('foobar');

  add = "";
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe("foobar");
});

test("TagComplete works case insensitive", async () => {
  let tags = ["Foo", "test"],
      add = "", remove = "";
  vi.stubGlobal("data", { "allTags": tags.concat("foobar") });
  const { container } = render(() =>
    <TagComplete tags={tags} addTag={(t) => add = t}
      removeTag={(t) => remove = t}/>);

  expect(screen.getByText("Foo")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(remove).toBe("");
  await userEvent.click(screen.getByText("Foo"));
  expect(remove).toBe("Foo");

  const input = container.querySelector("input");
  await userEvent.type(input, "f");
  expect(input.value).toEqual("f");
  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent('Foo');
  expect(completions[1]).toHaveTextContent('foobar');

  expect(add).toBe("");
  await userEvent.type(input, "{arrowdown}");
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe("foobar");

  await userEvent.type(input, "b");
  expect(input.value).toEqual("b");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(1);
  expect(completions[0]).toHaveTextContent('foobar');

  add = "";
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe("foobar");
});

test("TagComplete completes due dates", async () => {
  let tags = ["foo", "test"],
      add = "";
  vi.stubGlobal("data", { "allTags": tags });
  const { container } = render(() =>
    <TagComplete tags={tags} addTag={(t) => add = t}
      removeTag={() => null}/>);

  const input = container.querySelector("input");
  await userEvent.type(input, "due:");
  expect(input.value).toEqual("due:");
  let completions = document.querySelector(".autocomplete-popup");
  expect(completions).toBe(null);

  await userEvent.type(input, "tomorrow");
  expect(input.value).toEqual("due:tomorrow");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  expect(completions[0]).toHaveTextContent(`due:${dateStr}`);

  expect(add).toBe("");
  await userEvent.type(input, "{enter}{enter}");
  expect(add).toBe(`due:${dateStr}`);
});

test("TagComplete completes group tags", async () => {
  global.fetch = vi.fn();
  let tag = "",
      compl = {"foo bar": "grp:0", "bar foo": "grp:1"};
  global.fetch.mockResolvedValue({ ok: true, json: () => compl });
  vi.stubGlobal("data", { "allTags": [] });
  const { container } = render(() =>
    <TagComplete tags={[]} addTag={(t) => tag = t}
      removeTag={() => null}/>);

  const input = container.querySelector("input");
  await userEvent.type(input, "grp:");
  await vi.waitFor(() => {
    expect(screen.getByText("foo bar")).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group_complete/",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  expect(input.value).toEqual("grp:");
  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent("foo bar");
  expect(completions[1]).toHaveTextContent("bar foo");

  expect(tag).toBe("");
  await userEvent.type(input, "{enter}{enter}");
  expect(tag).toBe("grp:0");
});

test("TagComplete completes group tags with subject", async () => {
  global.fetch = vi.fn();
  let tag = "",
      compl = {"foo bar": "grp:0", "bar foo": "grp:1"};
  global.fetch.mockResolvedValue({ ok: true, json: () => compl });
  vi.stubGlobal("data", { "allTags": [] });
  const { container } = render(() =>
    <TagComplete tags={[]} addTag={(t) => tag = t}
      removeTag={() => null}/>);

  const input = container.querySelector("input");
  await userEvent.type(input, "grp:aaa");
  await vi.waitFor(() => {
    expect(screen.getByText("foo bar")).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group_complete/aaa",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  expect(input.value).toEqual("grp:aaa");
  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent("foo bar");
  expect(completions[1]).toHaveTextContent("bar foo");

  expect(tag).toBe("");
  await userEvent.type(input, "{enter}{enter}");
  expect(tag).toBe("grp:0");
});

// vim: tabstop=2 shiftwidth=2 expandtab
