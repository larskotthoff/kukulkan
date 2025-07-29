import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { Threads, ThreadGroup } from "./Threads.jsx";
import { SearchThreads } from "./SearchThreads.jsx";
import { TodoThreads } from "./TodoThreads.jsx";

const originalLocation = window.location,
      tags = ["foo", "foobar"];

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "open").mockImplementation(() => {});
  global.fetch = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = function() {};
  delete window.location;
  window.location = { ...originalLocation, search: '' };
  vi.stubGlobal("data", {"allTags": tags, "threads": []});
});

afterEach(() => {
  localStorage.clear();
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location = originalLocation;
});

test("exports Threads", () => {
  expect(Threads).not.toBe(undefined);
  expect(ThreadGroup).not.toBe(undefined);
});

test("renders components", async () => {
  vi.stubGlobal("data", {"allTags": tags});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("a[href='/write']")).not.toBe(null);
  expect(container.querySelector("a[href='/settings']")).not.toBe(null);
});

test("sets query and title based on URL", async () => {
  let { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("input").value).toEqual("");

  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  container = render(() => <Threads Threads={SearchThreads}/>).container;
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("input").value).toEqual("foo");

  expect(document.title).toBe("foo (0)");
});

test("sets query on submit", async () => {
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  await userEvent.type(input, "foo{enter}{enter}");
  expect(window.location.search).toBe("query=foo");
});

test("shows predefined query completions", async () => {
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  await userEvent.type(input, "t");
  expect(input.value).toEqual("t");
  expect(screen.getByText("tag:unread")).toBeInTheDocument();
  expect(screen.getByText("tag:todo")).toBeInTheDocument();
  expect(screen.getByText("date:today")).toBeInTheDocument();
});

test("general shortcuts work", async () => {
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  expect(document.activeElement).not.toBe(input);
  await userEvent.type(document.body, "/");
  expect(document.activeElement).toBe(input);

  await userEvent.type(document.body, "c");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/write', '_self');
});

test("shortcuts that expect selection don't break if nothing selected", async () => {
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  await userEvent.type(document.body, "d");
  await userEvent.type(document.body, "t");
  await userEvent.type(document.body, "{delete}");
});

test("provides tag completions", async () => {
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  const input = container.querySelector("input");
  await userEvent.type(input, "tag:f");
  expect(input.value).toEqual("tag:f");
  expect(screen.getByText("tag:foo")).toBeInTheDocument();
  expect(screen.getByText("tag:foobar")).toBeInTheDocument();
});

test("shows threads", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {authors: ["foo@Author", "bar@Author"], subject: "test", tags: ["fooTag", "barTag"], total_messages: 2, newest_date: 1000, oldest_date: 100},
    {authors: ["test@1", "test@2"], subject: "foobar", tags: ["unread", "new"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});

  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("2 thread groups.")).toBeInTheDocument();

  expect(container.querySelectorAll(".thread").length).toBe(2);
  expect(container.querySelectorAll(".chip").length).toBe(12);
  expect(screen.getAllByText("foo@Author").length).toBe(2);
  expect(screen.getAllByText("bar@Author").length).toBe(2);
  expect(screen.getAllByText("fooTag").length).toBe(1);
  expect(screen.getAllByText("barTag").length).toBe(1);
  expect(screen.getAllByText("test").length).toBe(1);

  expect(screen.getAllByText("test@1").length).toBe(2);
  expect(screen.getAllByText("test@2").length).toBe(2);
  expect(screen.getAllByText("unread").length).toBe(1);
  expect(screen.getAllByText("new").length).toBe(1);
  expect(screen.getAllByText("foobar").length).toBe(1);
});

test("shows thread groups", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{authors: ["foo@Author", "bar@Author"], subject: "test", tags: ["grp:0"], total_messages: 2, newest_date: 1000, oldest_date: 100, thread_id: 0},
    {authors: ["test@1", "test@2"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100, thread_id: 1}]
  ]});

  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("1 thread group.")).toBeInTheDocument();

  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(1);

  expect(container.querySelectorAll(".thread").length).toBe(2);
  expect(container.querySelectorAll(".chip").length).toBe(10);
  expect(screen.getAllByText("foo@Author").length).toBe(2);
  expect(screen.getAllByText("bar@Author").length).toBe(2);
  expect(screen.getAllByText("test").length).toBe(1);

  expect(screen.getAllByText("test@1").length).toBe(2);
  expect(screen.getAllByText("test@2").length).toBe(2);
  expect(screen.getAllByText("foobar").length).toBe(1);
});

test("opens thread on enter and click", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(screen.getByText("1 thread group.")).toBeInTheDocument();

  await userEvent.type(document.body, "{enter}");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');

  await userEvent.click(container.querySelector(".thread"));
  expect(window.open).toHaveBeenCalledTimes(2);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');
});

test("opens thread on enter and click in same tab with config", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  localStorage.setItem("settings-openInTab", "_self");
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("1 thread group.")).toBeInTheDocument();

  await userEvent.type(document.body, "{enter}");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');

  await userEvent.click(container.querySelector(".thread"));
  expect(window.open).toHaveBeenCalledTimes(2);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_self');
});

test("navigation and selection shortcuts work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["test@1"], subject: "foobar1", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["test@2"], subject: "foobar2", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("2 thread groups.")).toBeInTheDocument();

  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "{ArrowDown}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "{ArrowUp}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "0");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "{home}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "{end}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");

  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(1);
  await userEvent.type(document.body, "k");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "{end}");
  await userEvent.type(document.body, "{enter}");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/thread?id=bar', '_self');
});

test("thread groups can be expanded and collapsed", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo1", authors: ["test@1"], subject: "foobar1", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["test@2"], subject: "foobar2", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("1 thread group.")).toBeInTheDocument();

  // threads collapsed
  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(1);
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "l");
  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(0);
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "h");
  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(1);
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.click(container.querySelector(".thread-group"));
  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(0);
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.click(container.querySelector(".thread-group"));
  expect(container.querySelectorAll(".thread-group.collapsed").length).toBe(1);
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
});

test("navigation shortcuts work with thread groups", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo1", authors: ["test@1"], subject: "foobar1", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["test@2"], subject: "foobar2", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}],
    [{thread_id: "foo3", authors: ["test@3"], subject: "foobar3", tags: ["grp:1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo4", authors: ["test@4"], subject: "foobar4", tags: ["grp:1"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("2 thread groups.")).toBeInTheDocument();

  // threads collapsed
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "{ArrowDown}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "{ArrowUp}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");

  await userEvent.type(document.body, "0");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "{home}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "{end}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");

  // threads expanded
  await userEvent.type(document.body, "{home}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "l");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, "l");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@4");
  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@3");
  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@2");
  await userEvent.type(document.body, "{home}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@1");
  await userEvent.type(document.body, "{end}");
  expect(container.querySelector(".thread.active").querySelector(".chip").textContent).toBe("test@4");
});

test("delete thread works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["unread"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "{delete}");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo/deleted%20-unread");
  expect(screen.queryByText("unread")).not.toBeInTheDocument();
  expect(screen.getByText("deleted")).toBeInTheDocument();
});

test("delete thread group works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["te@t"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "{delete}");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/deleted%20-unread");
  expect(screen.getAllByText("deleted").length).toBe(2);
});

test("delete expanded thread group works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["te@t"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "l");
  await userEvent.type(document.body, "{delete}");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo/deleted%20-unread");
  expect(screen.getByText("deleted")).toBeInTheDocument();
});

test("mark thread done works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["todo", "due:1970-01-01"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  expect(screen.getByText("todo")).toBeInTheDocument();
  expect(screen.getByText("due:1970-01-01")).toBeInTheDocument();

  await userEvent.type(document.body, "d");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo/-todo%20-due%3A1970-01-01");
  expect(screen.queryByText("todo")).not.toBeInTheDocument();
  expect(screen.queryByText("due:1970-01-01")).not.toBeInTheDocument();
});

test("mark thread group done works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo", authors: ["te@t"], subject: "foobar", tags: ["grp:0", "todo", "due:1970-01-01"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["te@t"], subject: "foobar", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  expect(screen.getByText("todo")).toBeInTheDocument();
  expect(screen.getByText("due:1970-01-01")).toBeInTheDocument();

  await userEvent.type(document.body, "d");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/-todo%20-due%3A1970-01-01");
  expect(screen.queryByText("todo")).not.toBeInTheDocument();
  expect(screen.queryByText("due:1970-01-01")).not.toBeInTheDocument();
});

test("tag edits work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["autho@s"], subject: "subject", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "t");
  await userEvent.type(document.querySelector("#edit-tag-box > input"), "-test foobar{enter}{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo/-test%20foobar");
  expect(screen.queryByText("test")).not.toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  expect(window.open).toHaveBeenCalledTimes(0);
});

test("tag edit box not shown when nothing there", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": []});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("0 thread groups.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "t");
  expect(document.querySelector("#edit-tag-box > input")).not.toBeInTheDocument();

  expect(global.fetch).toHaveBeenCalledTimes(0);
});

test("tag edits with multiple selection work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["autho@s"], subject: "subject", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["autho@s"], subject: "subject", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "t");
  await userEvent.type(document.querySelector("#edit-tag-box > input"), "-test1 foobar{enter}{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/-test1%20foobar");
  expect(screen.queryByText("test1")).not.toBeInTheDocument();
  expect(screen.queryByText("test2")).toBeInTheDocument();
  expect(screen.queryAllByText("foobar").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(window.open).toHaveBeenCalledTimes(0);
});

test("tag edits with multiple selection and thread groups work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo1", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}],
    {thread_id: "bar", authors: ["autho@s"], subject: "subject", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "t");
  await userEvent.type(document.querySelector("#edit-tag-box > input"), "-test2 foobar{enter}{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo1%20foo2%20bar/-test2%20foobar");
  expect(screen.queryByText("test2")).not.toBeInTheDocument();
  expect(screen.queryAllByText("foobar").length).toBe(3);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(window.open).toHaveBeenCalledTimes(0);
});

test("threads action icons only shown when something selected", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["test@1"], subject: "foobar1", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["test@2"], subject: "foobar2", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });

  expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  expect(container.querySelectorAll(".thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".threads-action-icons.hidden").length).toBe(1);

  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(1);
  expect(container.querySelectorAll(".threads-action-icons.hidden").length).toBe(0);
  expect(container.querySelectorAll(".threads-action-icons").length).toBe(1);

  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);
  expect(container.querySelectorAll(".threads-action-icons.hidden").length).toBe(0);
  expect(container.querySelectorAll(".threads-action-icons").length).toBe(1);
});

test("threads action icons work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["autho@s"], subject: "subject", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "bar", authors: ["autho@s"], subject: "subject", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  });

  // tag
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.click(container.querySelector("#tag"));
  await userEvent.type(document.querySelector("#edit-tag-box > input"), "-test1 foobar{enter}{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/-test1%20foobar");
  expect(screen.queryByText("test1")).not.toBeInTheDocument();
  expect(screen.queryByText("test2")).toBeInTheDocument();
  expect(screen.queryAllByText("foobar").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  // done
  await userEvent.type(document.body, "{home}");
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.click(container.querySelector("#done"));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/-todo");
  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  // delete
  await userEvent.type(document.body, "{home}");
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.click(container.querySelector("#delete"));
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo%20bar/deleted%20-unread");
  expect(screen.queryAllByText("deleted").length).toBe(2);
  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  // group
  await userEvent.type(document.body, "{home}");
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  global.fetch.mockResolvedValue({ ok: true, text: () => "grp:0" });
  await userEvent.click(container.querySelector("#group"));
  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group/foo%20bar");
  expect(screen.queryAllByText("grp:0").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);
});

test("tag edits completions work", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo", authors: ["autho@s"], subject: "subject", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "t");

  const input = document.querySelector("#edit-tag-box > input");
  await userEvent.type(input, "f");
  let completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent("foo");
  expect(completions[1]).toHaveTextContent("foobar");


  await userEvent.type(input, "{backspace}");

  await userEvent.type(input, "-f");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent("-foo");
  expect(completions[1]).toHaveTextContent("-foobar");

  await userEvent.type(input, "{backspace}{backspace}");

  await userEvent.type(input, "due:tomorrow");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  expect(completions[0]).toHaveTextContent(`due:${dateStr}`);
  await userEvent.type(input, "{enter}");

  await userEvent.type(input, " -f");
  completions = document.querySelector(".autocomplete-popup").children;
  expect(completions.length).toBe(2);
  expect(completions[0]).toHaveTextContent(`due:${dateStr} -foo`);
  expect(completions[1]).toHaveTextContent(`due:${dateStr} -foobar`);
});

test("shows todo due dates correctly after marking done", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  const now = new Date(),
        thr1 = {thread_id: "foo", authors: ["foo@Author", "bar@Author"], subject: "test1", tags:
          ["todo"], total_messages: 2, newest_date: 1000, oldest_date: 100},
        thr2 = structuredClone(thr1),
        thr3 = structuredClone(thr1);
  thr1.tags = thr1.tags.concat("due:" + (new Date(now.getTime() + 1000 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr2.subject = "test2";
  thr2.tags = thr2.tags.concat("due:" + (new Date(now.getTime() + 1500 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  thr3.subject = "test3";

  vi.stubGlobal("data", {"allTags": [], "threads": [thr1, thr2, thr3]});
  const { container } = render(() => <Threads Threads={TodoThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("test1")).toBeInTheDocument();
  });

  expect(container.querySelectorAll(".thread").length).toBe(3);
  expect(container.querySelectorAll(".thread")[0].querySelector("div").innerHTML).toBe("3年");
  expect(container.querySelectorAll(".thread")[0].querySelectorAll("div")[4].innerHTML).toBe("test1");
  expect(container.querySelectorAll(".thread")[1].querySelector("div").innerHTML).toBe("4年");
  expect(container.querySelectorAll(".thread")[1].querySelectorAll("div")[4].innerHTML).toBe("test2");
  expect(container.querySelectorAll(".thread")[2].querySelector("div").innerHTML).toBe("");
  expect(container.querySelectorAll(".thread")[2].querySelectorAll("div")[4].innerHTML).toBe("test3");

  await userEvent.type(document.body, "d");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("http://localhost:5000/api/tag_batch/thread/foo/-todo%20-due%3A"));

  expect(container.querySelectorAll(".thread").length).toBe(3);
  expect(container.querySelectorAll(".thread")[0].querySelector("div").innerHTML).toBe("4年");
  expect(container.querySelectorAll(".thread")[0].querySelectorAll("div")[4].innerHTML).toBe("test2");
  expect(container.querySelectorAll(".thread")[1].querySelector("div").innerHTML).toBe("");
  expect(container.querySelectorAll(".thread")[1].querySelectorAll("div")[4].innerHTML).toBe("test1");
  expect(container.querySelectorAll(".thread")[1].querySelectorAll("div")[5].innerHTML).toBe("");
  expect(container.querySelectorAll(".thread")[2].querySelector("div").innerHTML).toBe("");
  expect(container.querySelectorAll(".thread")[2].querySelectorAll("div")[4].innerHTML).toBe("test3");
});

test("group threads -- new group", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo1", authors: ["autho@s"], subject: "subject", tags: ["foo"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["autho@s"], subject: "subject", tags: ["bar"], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  global.fetch.mockResolvedValue({ ok: true, text: () => "grp:0" });
  await userEvent.type(document.body, "g");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group/foo1%20foo2");
  expect(screen.getAllByText("grp:0").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(screen.queryByText("2 thread groups.")).not.toBeInTheDocument();
  expect(screen.getByText("1 thread group.")).toBeInTheDocument();
});

test("group threads -- add to group", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo1", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}],
    {thread_id: "foo2", authors: ["autho@s"], subject: "subject", tags: [], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
  });
  expect(screen.getAllByText("grp:0").length).toBe(1);

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  global.fetch.mockResolvedValue({ ok: true, text: () => "grp:0" });
  await userEvent.type(document.body, "g");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group/foo1%20foo2");
  expect(screen.getAllByText("grp:0").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(screen.queryByText("2 thread groups.")).not.toBeInTheDocument();
  expect(screen.getByText("1 thread group.")).toBeInTheDocument();
});

test("group threads -- ungroup", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    [{thread_id: "foo1", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100}]
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread group.")).toBeInTheDocument();
  });

  expect(screen.getAllByText("grp:0").length).toBe(2);
  await userEvent.type(document.body, "l");
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "g");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo1%20foo2/-grp%3A0");
  expect(screen.queryAllByText("grp:0").length).toBe(0);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(screen.queryByText("1 thread group.")).not.toBeInTheDocument();
  expect(screen.getByText("2 thread groups.")).toBeInTheDocument();
});

test("group threads -- ungroup then new group", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  vi.stubGlobal("data", {"allTags": tags, "threads": [
    {thread_id: "foo1", authors: ["autho@s"], subject: "subject", tags: ["grp:0"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo2", authors: ["autho@s"], subject: "subject", tags: ["grp:1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
    {thread_id: "foo3", authors: ["autho@s"], subject: "subject", tags: [], total_messages: 1, newest_date: 1000, oldest_date: 100}
  ]});
  const { container } = render(() => <Threads Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("3 thread groups.")).toBeInTheDocument();
  });
  expect(screen.getByText("grp:0")).toBeInTheDocument();
  expect(screen.getByText("grp:1")).toBeInTheDocument();

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(3);

  global.fetch.mockResolvedValue({ ok: true, text: () => "grp:2" });
  await userEvent.type(document.body, "g");
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo1/-grp%3A0");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/thread/foo2/-grp%3A1");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/group/foo1%20foo2%20foo3");
  expect(screen.queryByText("grp:0")).not.toBeInTheDocument();
  expect(screen.queryByText("grp:1")).not.toBeInTheDocument();
  expect(screen.getAllByText("grp:2").length).toBe(3);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(screen.queryByText("2 thread groups.")).not.toBeInTheDocument();
  expect(screen.getByText("1 thread group.")).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
