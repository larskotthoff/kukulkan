import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { TodoThreads, sortThreadsByDueDate } from "./TodoThreads.jsx";

afterEach(() => {
  cleanup();
});

const threads = [{authors: "fooAuthor, barAuthor", subject: "test",
  tags: ["todo"], total_messages: 2, newest_date: 1000, oldest_date: 100}];

test("exports TodoThreads", () => {
  expect(TodoThreads).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <TodoThreads threads={threads} index={() => 0} activeThread={() => 0} selectedThreads={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
});

test("shows threads", () => {
  const { container } = render(() => <TodoThreads threads={[threads[0], threads[0]]} index={() => 0} activeThread={() => 2} selectedThreads={() => []}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(2);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(0);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(6);
  expect(screen.getAllByText("fooAuthor").length).toBe(2);
  expect(screen.getAllByText("barAuthor").length).toBe(2);
  expect(screen.getAllByText("todo").length).toBe(2);
  expect(screen.getAllByText("test").length).toBe(2);
});

test("sets active and selected classes", () => {
  const { container } = render(() => <TodoThreads threads={threads} index={() => 0} activeThread={() => 0} selectedThreads={() => [0]}/>);

  expect(container.querySelectorAll(".kukulkan-thread").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.active").length).toBe(1);
  expect(container.querySelectorAll(".kukulkan-thread.selected").length).toBe(1);
});

test("sets active thread on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <TodoThreads threads={threads} index={() => 0} activeThread={() => 0}
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
        t = JSON.parse(JSON.stringify(threads)),
        tags = JSON.parse(JSON.stringify(threads[0].tags));

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() - 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("overdue!")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + now.toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("今日")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("明日")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("2日")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("2週")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("4週")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("3月")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("12月")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 1000 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads threads={t} index={() => 0} activeThread={() => 1} selectedThreads={() => []}/>);
  expect(screen.getByText("3年")).toBeInTheDocument();

  vi.useRealTimers();
});

test("sorts threads by due date", () => {
  const t1 = JSON.parse(JSON.stringify(threads[0])),
        t2 = JSON.parse(JSON.stringify(threads[0])),
        t3 = JSON.parse(JSON.stringify(threads[0]));
  t3.tags.push("due:1970-01-01");
  t1.tags.push("due:1971-01-01");

  expect([t1, t2, t3].sort(sortThreadsByDueDate)).toStrictEqual([t3, t1, t2]);
});

// vim: tabstop=2 shiftwidth=2 expandtab