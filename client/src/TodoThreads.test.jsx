import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { ThreadGroup } from "./Threads.jsx";
import { TodoThreads, sortThreadsByDueDate } from "./TodoThreads.jsx";

afterEach(() => {
  cleanup();
});

const threads = [{authors: ["foo@Author", "bar@Author"], subject: "test",
  tags: ["todo"], total_messages: 2, newest_date: 1000, oldest_date: 100, thread_id: 0}];

test("exports TodoThreads", () => {
  expect(TodoThreads).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => threads} activeThread={() => 0}
    setActiveThread={() => 0} selectedThreads={() => []} setQuery={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
});

test("shows threads", () => {
  const { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => [threads[0], threads[0]]}
    activeThread={() => 2} setActiveThread={() => 0} selectedThreads={() => []} setQuery={() => []}/>);

  expect(container.querySelectorAll(".thread").length).toBe(2);
  expect(container.querySelectorAll(".thread.active").length).toBe(0);
  expect(container.querySelectorAll(".thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(10);
  expect(screen.getAllByText("foo@Author").length).toBe(4);
  expect(screen.getAllByText("bar@Author").length).toBe(4);
  expect(screen.getAllByText("todo").length).toBe(2);
  expect(screen.getAllByText("test").length).toBe(2);
});

test("sets active and selected classes", () => {
  const { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => threads} activeThread={() => 0}
    setActiveThread={() => 0} selectedThreads={() => [0]} setQuery={() => []}/>);

  expect(container.querySelectorAll(".thread").length).toBe(1);
  expect(container.querySelectorAll(".thread.active").length).toBe(1);
  expect(container.querySelectorAll(".thread.selected").length).toBe(1);
});

test("sets active thread on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => threads} activeThread={() => 0}
          selectedThreads={() => []} setActiveThread={setActiveThread} setQuery={() => []} openActive={() => 0}/>);

  expect(container.querySelectorAll(".thread").length).toBe(1);

  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
  await userEvent.click(container.querySelector(".thread"));
  expect(setActiveThread).toHaveBeenCalledTimes(2);
  expect(setActiveThread).toHaveBeenCalledWith(0);
});

test("shows due dates correctly", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));

  const now = new Date(),
        t = JSON.parse(JSON.stringify(threads)),
        tags = JSON.parse(JSON.stringify(threads[0].tags));

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() - 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("overdue!")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + now.toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("今日")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("明日")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("Wed")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("2週")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("4週")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("3月")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByText("12月")).toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 1000 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
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

test("shows calendar when there are due dates, but not otherwise", () => {
  let { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => threads} activeThread={() => 1}
    setActiveThread={() => 0} selectedThreads={() => []} setQuery={() => []}/>);
  expect(container.querySelector(".calendar")).toBe(null);
  cleanup();

  const t = JSON.parse(JSON.stringify(threads)),
        tags = JSON.parse(JSON.stringify(threads[0].tags));
  t[0].tags = tags.concat("due:1970-01-01");

  container = (render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1}
    setActiveThread={() => 0} selectedThreads={() => []} setQuery={() => []}/>)).container;
  expect(container.querySelector(".calendar")).not.toBe(null);
});

test("first calendar date is today or earliest overdue", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));

  const now = new Date(),
        t = JSON.parse(JSON.stringify(threads)),
        tags = JSON.parse(JSON.stringify(threads[0].tags));

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByTestId("Mon Jul 01 2024")).toBeInTheDocument();
  expect(screen.queryByTestId("Sun Jun 30 2024")).not.toBeInTheDocument();
  cleanup();

  t[0].tags = tags.concat("due:" + (new Date(now.getTime() - 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => t} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByTestId("Sun Jun 30 2024")).toBeInTheDocument();

  vi.useRealTimers();
});

test("last calendar date is last due", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));

  const now = new Date(),
        thr1 = JSON.parse(JSON.stringify(threads[0])),
        thr2 = JSON.parse(JSON.stringify(threads[0])),
        tags = JSON.parse(JSON.stringify(threads[0].tags));

  thr1.tags = tags.concat("due:" + (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr2.tags = tags.concat("due:" + (new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr2.thread_id = 1;
  render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => [thr1, thr2]} activeThread={() => 1} selectedThreads={() => []}
    setActiveThread={() => 0} setQuery={() => []}/>);
  expect(screen.getByTestId("Mon Jul 01 2024")).toBeInTheDocument();
  expect(screen.getByTestId("Wed Jul 31 2024")).toBeInTheDocument();
  expect(screen.queryByTestId("Thu Aug 01 2024")).not.toBeInTheDocument();

  vi.useRealTimers();
});

test("todo boxes shown next to calendar dates for emails with due dates", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));

  const now = new Date(),
        thr1 = JSON.parse(JSON.stringify(threads[0])),
        thr2 = JSON.parse(JSON.stringify(threads[0])),
        thr3 = JSON.parse(JSON.stringify(threads[0])),
        thr4 = JSON.parse(JSON.stringify(threads[0])),
        tags = JSON.parse(JSON.stringify(threads[0].tags));

  thr1.tags = tags.concat("due:" + (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr2.tags = tags.concat("due:" + (new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr2.thread_id = 1;
  thr3.tags = tags.concat("due:" + (new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr3.thread_id = 2;
  thr4.thread_id = 3;
  const { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => [thr1, thr2, thr3, thr4]}
    activeThread={() => 1} setActiveThread={() => 0} selectedThreads={() => []} setQuery={() => []}/>);
  expect(container.querySelectorAll(".calendar-box").length).toBe(3);
  expect(screen.getByTestId("Tue Jul 02 2024-boxes").querySelectorAll(".calendar-box").length).toBe(1);
  expect(screen.getByTestId("Wed Jul 31 2024-boxes").querySelectorAll(".calendar-box").length).toBe(2);

  vi.useRealTimers();
});

test("clicking on todo boxes changes active thread", async () => {
  const thr1 = JSON.parse(JSON.stringify(threads[0])),
        thr2 = JSON.parse(JSON.stringify(threads[0])),
        thr3 = JSON.parse(JSON.stringify(threads[0])),
        tags = JSON.parse(JSON.stringify(threads[0].tags)),
        setActiveThread = vi.fn();

  thr1.tags = tags.concat("due:1970-01-01");
  thr2.tags = tags.concat("due:1970-01-02");
  thr2.thread_id = 1;
  thr3.tags = tags.concat("due:1970-01-02");
  thr3.thread_id = 2;
  const { container } = render(() => <TodoThreads ThreadGroup={ThreadGroup} threads={() => [thr1, thr2, thr3]} activeThread={() => 0}
    selectedThreads={() => []} setActiveThread={setActiveThread} setQuery={() => []}/>);
  expect(container.querySelectorAll(".calendar-box").length).toBe(3);

  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
  await userEvent.click(container.querySelectorAll(".calendar-box")[0]);
  expect(setActiveThread).toHaveBeenCalledTimes(2);
  expect(setActiveThread).toHaveBeenCalledWith(0);

  await userEvent.click(container.querySelectorAll(".calendar-box")[1]);
  expect(setActiveThread).toHaveBeenCalledTimes(3);
  expect(setActiveThread).toHaveBeenCalledWith(1);

  await userEvent.click(container.querySelectorAll(".calendar-box")[2]);
  expect(setActiveThread).toHaveBeenCalledTimes(4);
  expect(setActiveThread).toHaveBeenCalledWith(2);
});

// vim: tabstop=2 shiftwidth=2 expandtab
