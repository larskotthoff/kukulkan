import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { SearchThreads } from "./SearchThreads.jsx";
import { renderDateNumThread } from "./utils.js";

afterEach(() => {
  cleanup();
});

const threads = [{authors: "fooAuthor, barAuthor", subject: "test", tags:
  ["fooTag", "barTag"], total_messages: 2, newest_date: 1000, oldest_date: 100}];

test("exports SearchThreads", () => {
  expect(SearchThreads).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
});

test("shows threads", () => {
  const { container } = render(() => <SearchThreads threads={() => [threads[0], threads[0]]} index={() => 0} activeThread={() => 2}
    selectedThreads={() => []} setQuery={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(2);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(0);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(8);
  expect(screen.getAllByText("fooAuthor").length).toBe(2);
  expect(screen.getAllByText("barAuthor").length).toBe(2);
  expect(screen.getAllByText("fooTag").length).toBe(2);
  expect(screen.getAllByText("barTag").length).toBe(2);
  expect(screen.getAllByText("test").length).toBe(2);
  expect(screen.getAllByText(renderDateNumThread(threads[0])).length).toBe(2);
});

test("sets active and selected classes", () => {
  const { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
    selectedThreads={() => [0]} setQuery={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(1);
});

test("sets active threads on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
          selectedThreads={() => []} setActiveThread={setActiveThread} setQuery={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);

  await userEvent.click(container.querySelector(".kukulkan-thread"));
  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
});

// vim: tabstop=2 shiftwidth=2 expandtab
