import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

import { Thread } from "./Thread.jsx";

const thread = [
  {
    from: "foo bar <foo@bar.com>",
    to: "bar foo <bar@foo.com>",
    cc: "test@test.com",
    subject: "Test.",
    date: "Thu, 01 Jan 1970 00:00:00 -0000",
    tags: [ "foo", "bar", "test" ],
    notmuch_id: "fo@o",
    attachments: [ { content_type: "text", content_size: 100, filename: "foo.txt" } ],
    body: {
      "text/html": "Test mail in HTML",
      "text/plain": "Test mail"
    }
  },
  {
    from: "foo2 bar <foo@bar.com>",
    to: "bar2 foo2 <bar@foo.com>",
    cc: "test2@test2.com",
    subject: "Test2.",
    date: "Fri, 02 Jan 1970 00:00:00 -0000",
    tags: [ "foo2", "bar2", "test2" ],
    notmuch_id: "ba@r",
    attachments: [],
    body: {
      "text/html": "Test mail in HTML2",
      "text/plain": "Test mail2"
    }
  }
];

beforeEach(() => {
  vi.spyOn(window, "open").mockImplementation(() => {});
  global.fetch = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = function() {};
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("exports Thread", () => {
  expect(Thread).not.toBe(undefined);
});

test("fetches and renders thread", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => thread })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test2.")).toBeInTheDocument();
  });

  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar2 foo2 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test2@test2.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.getByText("foo2")).toBeInTheDocument();
  expect(screen.getByText("bar2")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();

  expect(document.title).toBe("Test2.");
});

test("changing active message works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => thread })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  expect(screen.queryByText("bar foo <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.queryByText("bar")).not.toBeInTheDocument();
  expect(screen.queryByText("test")).not.toBeInTheDocument();

  await vi.waitFor(() => {
    expect(screen.getByText("Test2.")).toBeInTheDocument();
  });

  await userEvent.type(document.body, "k");
  // expanded email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("foo.txt (100 Bi, text)")).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // collapsed email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("bar2 foo2 <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test2@test2.com")).not.toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.queryByText("foo2")).not.toBeInTheDocument();
  expect(screen.queryByText("bar2")).not.toBeInTheDocument();
  expect(screen.queryByText("test2")).not.toBeInTheDocument();

  expect(document.title).toBe("Test.");

  await userEvent.type(document.body, "j");
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("bar foo <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.queryByText("bar")).not.toBeInTheDocument();
  expect(screen.queryByText("test")).not.toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar2 foo2 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test2@test2.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.getByText("foo2")).toBeInTheDocument();
  expect(screen.getByText("bar2")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();

  await userEvent.click(container.querySelector(".kukulkan-message:not(.active)"));
  // expanded email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("foo.txt (100 Bi, text)")).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // collapsed email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("bar2 foo2 <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test2@test2.com")).not.toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.queryByText("foo2")).not.toBeInTheDocument();
  expect(screen.queryByText("bar2")).not.toBeInTheDocument();
  expect(screen.queryByText("test2")).not.toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
