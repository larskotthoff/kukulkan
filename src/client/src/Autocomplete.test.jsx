import { test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

import { createSignal } from "solid-js";
import { Autocomplete } from "./Autocomplete.jsx";

test("exports Autocomplete", () => {
  expect(Autocomplete).not.toBe(undefined);
});

test("sets text", () => {
  const { getByTestId } = render(() => <Autocomplete text={() => "foo"}/>);
  const input = getByTestId("autocomplete-textinput");
  expect(input.querySelector("input").getAttribute("value")).toEqual("foo");
})

test("shows completions", async () => {
  const [testText, setTestText] = createSignal("");
  const { getByTestId } = render(() => <Autocomplete text={testText} setText={setTestText} getOptions={() => ["foo", "foobar"]}/>);
  const input = getByTestId("autocomplete-textinput");
  await user.type(input.querySelector("input"), "f");
  expect(input.querySelector("input").getAttribute("value")).toEqual("f");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
})
