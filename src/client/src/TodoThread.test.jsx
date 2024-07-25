import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

import { TodoThread, sortThreadsByDueDate } from "./TodoThread.jsx";

afterEach(() => {
  cleanup();
});

const thread = {authors: "fooAuthor, barAuthor", subject: "test",
  tags: ["todo"], total_messages: 2, newest_date: 1000, oldest_date: 100};

test("exports TodoThread", () => {
  expect(TodoThread).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <TodoThread thread={thread} index={() => 0} activeThread={() => 0} selectedThreads={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
});

test("shows thread", () => {
  const { container } = render(() => <TodoThread thread={thread} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(0);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(3);
  expect(screen.getByText("fooAuthor")).toBeInTheDocument();
  expect(screen.getByText("barAuthor")).toBeInTheDocument();
  expect(screen.getByText("todo")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
});

test("sets active and selected classes", () => {
  const { container } = render(() => <TodoThread thread={thread} index={() => 0} activeThread={() => 0} selectedThreads={() => [0]}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(1);
});

test("sets active thread on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <TodoThread thread={thread} index={() => 0} activeThread={() => 0}
          selectedThreads={() => []} setActiveThread={setActiveThread}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);

  await userEvent.click(container.querySelector(".kukulkan-thread"));
  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
});

test("shows due dates correctly", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));

  const now = new Date(),
        t = JSON.parse(JSON.stringify(thread)),
        tags = JSON.parse(JSON.stringify(thread.tags));

  t.tags = tags.concat("due:" + (new Date(now.getTime() - 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("overdue!")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + now.toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("today")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("tomorrow")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("this week")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("next week")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("this month")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("next month")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("this year")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("next year")).toBeInTheDocument();
  cleanup();

  t.tags = tags.concat("due:" + (new Date(now.getTime() + 1000 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThread thread={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("a long time")).toBeInTheDocument();

  vi.useRealTimers();
});

test("sorts threads by due date", () => {
  const t1 = JSON.parse(JSON.stringify(thread)),
        t2 = JSON.parse(JSON.stringify(thread)),
        t3 = JSON.parse(JSON.stringify(thread));
  t3.tags.push("due:1970-01-01");
  t1.tags.push("due:1971-01-01");

  expect([t1, t2, t3].sort(sortThreadsByDueDate)).toStrictEqual([t3, t1, t2]);
});

// vim: tabstop=2 shiftwidth=2 expandtab
