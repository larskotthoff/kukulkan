import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { SearchThreads } from "./SearchThreads.jsx";
import { renderDateNumThread } from "./utils.js";

const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  delete window.location;
  window.location = { ...originalLocation, search: '' };
  vi.stubGlobal("data", {"allTags": ["foo", "bar"], "threads": []});
  global.fetch = vi.fn();
});

afterEach(() => {
  localStorage.clear();
  cleanup();
  window.location = originalLocation;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const threads = [{authors: ["foo@Author", "bar@Author"], subject: "test", tags:
  ["fooTag", "barTag"], total_messages: 2, newest_date: 1000, oldest_date: 100}];

test("exports SearchThreads", () => {
  expect(SearchThreads).not.toBe(undefined);
});

test("renders components", () => {
  const { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  expect(container.querySelector("div")).not.toBe(undefined);
  expect(container.querySelector("#query-box")).not.toBe(undefined);
  expect(container.querySelector("#query-box > input")).not.toBe(undefined);
});

test("shows completions and allows to select", async () => {
  const { container } = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  await userEvent.type(container.querySelector("#query-box > input"), "t");
  expect(screen.getByText("tag:unread")).toBeInTheDocument();
  expect(screen.getByText("tag:todo")).toBeInTheDocument();

  container.querySelector("#query-box > input").value = "";
  await userEvent.type(container.querySelector("#query-box > input"), "d");
  expect(screen.getByText("date:today")).toBeInTheDocument();

  await userEvent.type(container.querySelector("#query-box > input"), "{enter}{enter}");
  expect(window.location.search).toBe("query=date%3Atoday");
});

test("shows tag completions and allows to select", async () => {
  const { container } = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  await userEvent.type(container.querySelector("#query-box > input"), "tag:f");
  expect(screen.getByText("tag:foo")).toBeInTheDocument();

  await userEvent.type(container.querySelector("#query-box > input"), "{enter}{enter}");
  expect(window.location.search).toBe("query=tag%3Afoo");
});

test("shows adress completions and allows to select", async () => {
  const { container } = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  global.fetch.mockResolvedValue({ ok: true, json: () => ["tester@test.com", "foo@bar.com"] });
  await userEvent.type(container.querySelector("#query-box > input"), "from:test");
  await vi.waitFor(() => {
    expect(screen.getByText("from:tester@test.com")).toBeInTheDocument();
  }, { timeout: 1200 });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/email/test",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));

  await userEvent.type(container.querySelector("#query-box > input"), "{enter}{enter}");
  expect(window.location.search).toBe("query=from%3Atester%40test.com");
});

test("shows combined completions and allows to select", async () => {
  const { container } = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  global.fetch.mockResolvedValue({ ok: true, json: () => ["tester@test.com", "foo@bar.com"] });

  await userEvent.type(container.querySelector("#query-box > input"), "tag:f");
  expect(screen.getByText("tag:foo")).toBeInTheDocument();

  await userEvent.type(container.querySelector("#query-box > input"), "{enter}");

  await userEvent.type(container.querySelector("#query-box > input"), " and from:test");
  await vi.waitFor(() => {
    expect(screen.getByText("tag:foo and from:tester@test.com")).toBeInTheDocument();
  }, { timeout: 1200 });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/email/test",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));

  await userEvent.type(container.querySelector("#query-box > input"), "{enter}{enter}");
  expect(window.location.search).toBe("query=tag%3Afoo+and+from%3Atester%40test.com");
});

test("saves queries for completion", async () => {
  let { container } = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>);
  await userEvent.type(container.querySelector("#query-box > input"), "t");
  expect(screen.queryByText("tag:foo")).not.toBeInTheDocument();
  cleanup();

  vi.stubGlobal('location', {
    ...window.location,
    search: '?query=tag:foo'
  });
  container = render(() => <SearchThreads threads={() => []} index={() => 0} activeThread={() => 0}
    selectedThreads={() => []} setQuery={() => []}/>).container;
  container.querySelector("#query-box > input").value = "";
  await userEvent.type(container.querySelector("#query-box > input"), "t");
  expect(screen.getByText("tag:foo")).toBeInTheDocument();
});

test("shows threads", () => {
  const { container } = render(() => <SearchThreads threads={() => [threads[0], threads[0]]} index={() => 0} activeThread={() => 2}
    selectedThreads={() => []} setQuery={() => []}/>);

  expect(container.querySelectorAll(".thread").length).toBe(2);
  expect(container.querySelectorAll(".thread.active").length).toBe(0);
  expect(container.querySelectorAll(".thread.selected").length).toBe(0);
  expect(container.querySelectorAll(".chip").length).toBe(12);
  expect(screen.getAllByText("foo@Author").length).toBe(4);
  expect(screen.getAllByText("bar@Author").length).toBe(4);
  expect(screen.getAllByText("fooTag").length).toBe(2);
  expect(screen.getAllByText("barTag").length).toBe(2);
  expect(screen.getAllByText("test").length).toBe(2);
  expect(screen.getAllByText(renderDateNumThread(threads[0]).join(" ")).length).toBe(2);
});

test("sets active and selected classes", () => {
  const { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
    selectedThreads={() => [0]} setQuery={() => []}/>);

  expect(container.querySelectorAll(".thread").length).toBe(1);
  expect(container.querySelectorAll(".thread.active").length).toBe(1);
  expect(container.querySelectorAll(".thread.selected").length).toBe(1);
});

test("sets active threads on click", async () => {
  const setActiveThread = vi.fn(),
        { container } = render(() => <SearchThreads threads={() => threads} index={() => 0} activeThread={() => 0}
          selectedThreads={() => []} setActiveThread={setActiveThread} setQuery={() => []} openActive={() => 0}/>);

  expect(container.querySelectorAll(".thread").length).toBe(1);

  await userEvent.click(container.querySelector(".thread"));
  expect(setActiveThread).toHaveBeenCalledTimes(1);
  expect(setActiveThread).toHaveBeenCalledWith(0);
});

// vim: tabstop=2 shiftwidth=2 expandtab
