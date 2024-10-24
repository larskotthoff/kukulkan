import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { Kukulkan } from "./Kukulkan.jsx";
import { SearchThreads } from "./SearchThreads.jsx";

const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "open").mockImplementation(() => {});
  global.fetch = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = function() {};
  delete window.location;
  window.location = { ...originalLocation, search: '' };
});

afterEach(() => {
  localStorage.clear();
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location = originalLocation;
});

test("exports Kukulkan", () => {
  expect(Kukulkan).not.toBe(undefined);
});

test("renders components", async () => {
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("a[href='/write']")).not.toBe(null);
});

test("sets query and title based on URL", async () => {
  let { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("input").getAttribute("value")).toEqual("");

  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => "" });
  container = render(() => <Kukulkan Threads={SearchThreads}/>).container;
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(container.querySelector("input").getAttribute("value")).toEqual("foo");

  expect(document.title).toBe("foo");
});

test("sets query on submit", async () => {
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  await userEvent.type(input, "foo{enter}{enter}");
  expect(window.location.search).toBe("query=foo");
});

test("shows predefined query completions", async () => {
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  await userEvent.type(input, "t");
  expect(input.getAttribute("value")).toEqual("t");
  expect(screen.getByText("tag:unread")).toBeInTheDocument();
  expect(screen.getByText("tag:todo")).toBeInTheDocument();
  expect(screen.getByText("date:today")).toBeInTheDocument();
});

test("general shortcuts work", async () => {
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  const input = container.querySelector("input");
  expect(document.activeElement).not.toBe(input);
  await userEvent.type(document.body, "/");
  expect(document.activeElement).toBe(input);

  await userEvent.type(document.body, "c");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/write', '_blank');
});

test("fetches tags and provides completions", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  const input = container.querySelector("input");
  await userEvent.type(input, "tag:f");
  expect(input.getAttribute("value")).toEqual("tag:f");
  expect(screen.getByText("tag:foo")).toBeInTheDocument();
  expect(screen.getByText("tag:foobar")).toBeInTheDocument();
});

test("shows threads", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {authors: "fooAuthor, barAuthor", subject: "test", tags: ["fooTag", "barTag"], total_messages: 2, newest_date: 1000, oldest_date: 100},
            {authors: "test1, test2", subject: "foobar", tags: ["unread", "new"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.getByText("2 threads.")).toBeInTheDocument();

  expect(container.querySelectorAll(".thread").length).toBe(2);
  expect(container.querySelectorAll(".chip").length).toBe(8);
  expect(screen.getByText("fooAuthor")).toBeInTheDocument();
  expect(screen.getByText("barAuthor")).toBeInTheDocument();
  expect(screen.getByText("fooTag")).toBeInTheDocument();
  expect(screen.getByText("barTag")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(screen.getByText("test1")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();
  expect(screen.getByText("unread")).toBeInTheDocument();
  expect(screen.getByText("new")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
});

test("opens thread on enter and click", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "test", subject: "foobar", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.getByText("1 thread.")).toBeInTheDocument();

  await userEvent.type(document.body, "{enter}");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_blank');

  await userEvent.click(container.querySelector(".thread"));
  expect(window.open).toHaveBeenCalledTimes(2);
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_blank');
  expect(window.open).toHaveBeenCalledWith('/thread?id=foo', '_blank');
});

test("opens thread on enter and click in same tab with config", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "test", subject: "foobar", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  localStorage.setItem("settings-openInTab", "_self");
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.getByText("1 thread.")).toBeInTheDocument();

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
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "test1", subject: "foobar1", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
            {thread_id: "bar", authors: "test2", subject: "foobar2", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(container.querySelector("input")).not.toBe(null);
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.getByText("2 threads.")).toBeInTheDocument();

  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test1");

  await userEvent.type(document.body, "j");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test2");
  await userEvent.type(document.body, "k");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test1");

  await userEvent.type(document.body, "J");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test2");
  await userEvent.type(document.body, "K");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test1");

  await userEvent.type(document.body, "0");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test2");
  await userEvent.type(document.body, "{home}");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test1");
  await userEvent.type(document.body, "{end}");
  expect(container.querySelector(".thread.active").querySelector(".MuiChip-label").textContent).toBe("test2");

  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(1);
  await userEvent.type(document.body, "k");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "{end}");
  await userEvent.type(document.body, "{enter}");
  expect(window.open).toHaveBeenCalledTimes(1);
  expect(window.open).toHaveBeenCalledWith('/thread?id=bar', '_blank');
});

test("delete thread works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "test", subject: "foobar", tags: ["unread"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread.")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await userEvent.type(document.body, "{delete}");
  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/foo/unread");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/thread/foo/deleted");
  expect(screen.queryByText("unread")).not.toBeInTheDocument();
  expect(screen.getByText("deleted")).toBeInTheDocument();
});

test("mark thread done works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "test", subject: "foobar", tags: ["todo", "due:1970-01-01"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread.")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.getByText("todo")).toBeInTheDocument();
  expect(screen.getByText("due:1970-01-01")).toBeInTheDocument();

  await userEvent.type(document.body, "d");
  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/foo/todo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/foo/due%3A1970-01-01");
  expect(screen.queryByText("todo")).not.toBeInTheDocument();
  expect(screen.queryByText("due:1970-01-01")).not.toBeInTheDocument();
});

test("tag edits work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "authors", subject: "subject", tags: ["test"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("1 thread.")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await userEvent.type(document.body, "t");
  await userEvent.type(document.querySelector("#edit-tag-box"), "-test foobar{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/foo/test");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/thread/foo/foobar");
  expect(screen.queryByText("test")).not.toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  expect(window.open).toHaveBeenCalledTimes(0);
});

test("tag edits with multiple selection work", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=foo'
  });
  global.fetch = vi.fn((url) => {
    switch(url) {
      case "http://localhost:5000/api/query/foo":
        return Promise.resolve({ ok: true, json: () => [
            {thread_id: "foo", authors: "authors", subject: "subject", tags: ["test1"], total_messages: 1, newest_date: 1000, oldest_date: 100},
            {thread_id: "bar", authors: "authors", subject: "subject", tags: ["test2"], total_messages: 1, newest_date: 1000, oldest_date: 100}
        ]});
      case "http://localhost:5000/api/tags":
        return Promise.resolve({ ok: true, json: () => ["foo", "foobar"] });
      default:
        return Promise.resolve({ ok: true, json: () => [] });
    }
  });
  const { container } = render(() => <Kukulkan Threads={SearchThreads}/>);
  await vi.waitFor(() => {
    expect(screen.getByText("2 threads.")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/query/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await userEvent.type(document.body, " ");
  await userEvent.type(document.body, "j");
  await userEvent.type(document.body, " ");
  expect(container.querySelectorAll(".thread.selected").length).toBe(2);

  await userEvent.type(document.body, "t");
  await userEvent.type(document.querySelector("#edit-tag-box"), "-test1 foobar{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(6);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/foo/test1");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/thread/foo/foobar");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/thread/bar/test1");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/thread/bar/foobar");
  expect(screen.queryByText("test1")).not.toBeInTheDocument();
  expect(screen.queryByText("test2")).toBeInTheDocument();
  expect(screen.queryAllByText("foobar").length).toBe(2);

  expect(container.querySelectorAll(".thread.selected").length).toBe(0);

  expect(window.open).toHaveBeenCalledTimes(0);
});

// vim: tabstop=2 shiftwidth=2 expandtab
