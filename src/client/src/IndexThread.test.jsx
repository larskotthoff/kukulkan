import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { IndexThread } from "./IndexThread.jsx";
import { renderDateNumThread } from "./utils.js";

afterEach(() => {
  cleanup();
});

const thread = {authors: "fooAuthor, barAuthor", subject: "test", tags:
  ["fooTag", "barTag"], total_messages: 2, newest_date: 1000, oldest_date: 100};

test("exports IndexThread", () => {
  expect(IndexThread).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <IndexThread thread={thread} index={() => 0} activeThread={() => 0} selectedThreads={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
});

test("shows thread", () => {
  const { container } = render(() => <IndexThread thread={thread} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(0);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(4);
  expect(screen.getByText("fooAuthor")).toBeInTheDocument();
  expect(screen.getByText("barAuthor")).toBeInTheDocument();
  expect(screen.getByText("fooTag")).toBeInTheDocument();
  expect(screen.getByText("barTag")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(screen.getByText(renderDateNumThread(thread))).toBeInTheDocument();
});

test("sets active and selected classes", () => {
  const { container } = render(() => <IndexThread thread={thread} index={() => 0} activeThread={() => 0} selectedThreads={() => [0]}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(1);
});

test("sets active thread on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <IndexThread thread={thread} index={() => 0} activeThread={() => 0}
          selectedThreads={() => []} setActiveThread={setActiveThread}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);

  await userEvent.click(container.querySelector(".kukulkan-thread"));
  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
});

// vim: tabstop=2 shiftwidth=2 expandtab
