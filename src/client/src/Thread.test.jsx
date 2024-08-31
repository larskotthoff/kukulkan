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
    message_id: "foo",
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
    message_id: "bar",
    in_reply_to: "<foo>",
    attachments: [],
    body: {
      "text/html": "Test mail in HTML2",
      "text/plain": "Test mail2"
    }
  }
];

const complexThread = thread.slice();
complexThread.push({
    from: "foo3 bar <foo@bar.com>",
    to: "bar3 foo3 <bar@foo.com>",
    cc: "test3@test3.com",
    subject: "Test3.",
    date: "Sat, 03 Jan 1970 00:00:00 -0000",
    tags: [ "foo3", "bar3", "test3" ],
    notmuch_id: "ba@r2",
    message_id: "bar2",
    in_reply_to: "<foo>",
    attachments: [],
    body: {
      "text/html": "Test mail in HTML3",
      "text/plain": "Test mail3"
    }
});

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
  const { container } = render(() => <Thread/>);

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

  // thread nav
  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs.length).toBe(2);
  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("0em");
  expect(navs[0].style["border-color"]).toBe("white");
  expect(navs[1].style["border-color"]).toBe("black");
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

  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs[0].style["border-color"]).toBe("white");
  expect(navs[1].style["border-color"]).toBe("black");

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

  expect(navs[0].style["border-color"]).toBe("black");
  expect(navs[1].style["border-color"]).toBe("white");

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

  expect(navs[0].style["border-color"]).toBe("white");
  expect(navs[1].style["border-color"]).toBe("black");

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

  expect(navs[0].style["border-color"]).toBe("black");
  expect(navs[1].style["border-color"]).toBe("white");

  await userEvent.click(navs[1]);
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

  expect(navs[0].style["border-color"]).toBe("white");
  expect(navs[1].style["border-color"]).toBe("black");

  await userEvent.click(navs[0]);
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

  expect(navs[0].style["border-color"]).toBe("black");
  expect(navs[1].style["border-color"]).toBe("white");
});

test("thread nav shows and allows to navigate levels", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => complexThread })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test3.")).toBeInTheDocument();
  });

  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // initially hidden
  expect(screen.queryByText("foo2 bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail2")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(document.title).toBe("Test3.");

  // thread nav
  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs.length).toBe(3);
  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("1em");
  expect(navs[2].style["left"]).toBe("0em");
  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("0.3");
  expect(navs[2].style["opacity"]).toBe("1");

  // move level higher
  await userEvent.type(document.body, "l");
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // hidden
  expect(screen.queryByText("foo3 bar3 <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail3")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar2 foo2 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test2@test2.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.getByText("foo2")).toBeInTheDocument();
  expect(screen.getByText("bar2")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();

  expect(document.title).toBe("Test2.");

  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("1");
  expect(navs[2].style["opacity"]).toBe("0.3");

  // move back to lower level
  await userEvent.type(document.body, "h");
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // hidden again
  expect(screen.queryByText("foo2 bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail2")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(document.title).toBe("Test3.");

  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("0.3");
  expect(navs[2].style["opacity"]).toBe("1");

  await userEvent.click(navs[1]);
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // hidden
  expect(screen.queryByText("foo3 bar3 <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail3")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar2 foo2 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test2@test2.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.getByText("foo2")).toBeInTheDocument();
  expect(screen.getByText("bar2")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();

  expect(document.title).toBe("Test2.");

  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("1");
  expect(navs[2].style["opacity"]).toBe("0.3");

  await userEvent.click(navs[2]);
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // hidden again
  expect(screen.queryByText("foo2 bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail2")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(document.title).toBe("Test3.");

  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("0.3");
  expect(navs[2].style["opacity"]).toBe("1");
});

test("flat view works", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => complexThread })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test3.")).toBeInTheDocument();
  });

  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // initially hidden
  expect(screen.queryByText("foo2 bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail2")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(document.title).toBe("Test3.");

  // thread nav
  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs.length).toBe(3);
  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("1em");
  expect(navs[2].style["left"]).toBe("0em");
  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("0.3");
  expect(navs[2].style["opacity"]).toBe("1");

  await userEvent.type(document.body, "{shift>}f{/shift}");
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // other collapsed email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("0em");
  expect(navs[2].style["left"]).toBe("0em");
  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("1");
  expect(navs[2].style["opacity"]).toBe("1");

  await userEvent.type(document.body, "{shift>}f{/shift}");
  // collapsed email
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("foo.txt")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();

  // hidden again
  expect(screen.queryByText("foo2 bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail2")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo3 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar3 foo3 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test3@test3.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail3")).toBeInTheDocument();
  expect(screen.getByText("foo3")).toBeInTheDocument();
  expect(screen.getByText("bar3")).toBeInTheDocument();
  expect(screen.getByText("test3")).toBeInTheDocument();

  expect(navs.length).toBe(3);
  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("1em");
  expect(navs[2].style["left"]).toBe("0em");
  expect(navs[0].style["opacity"]).toBe("1");
  expect(navs[1].style["opacity"]).toBe("0.3");
  expect(navs[2].style["opacity"]).toBe("1");
});

test("works correctly when msg references are messed up", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  const tmp = JSON.parse(JSON.stringify(thread));
  tmp[1].in_reply_to = "<doesnotexist>";
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => tmp })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test2.")).toBeInTheDocument();
  });

  // not shown
  expect(screen.queryByText("foo bar <foo@bar.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("foo.txt")).not.toBeInTheDocument();
  expect(screen.queryByText("Test mail")).not.toBeInTheDocument();

  // expanded email
  expect(screen.getByText("foo2 bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar2 foo2 <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test2@test2.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail2")).toBeInTheDocument();
  expect(screen.getByText("foo2")).toBeInTheDocument();
  expect(screen.getByText("bar2")).toBeInTheDocument();
  expect(screen.getByText("test2")).toBeInTheDocument();

  expect(document.title).toBe("Test2.");

  // thread nav
  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs.length).toBe(2);
  expect(navs[0].style["left"]).toBe("1em");
  expect(navs[1].style["left"]).toBe("0em");
  expect(navs[0].style["opacity"]).toBe("0.3");
  expect(navs[1].style["opacity"]).toBe("1");
});

test("sets active message based on unread", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  const tmp = JSON.parse(JSON.stringify(thread));
  tmp[0].tags.push("unread");
  tmp[1].tags.push("unread");
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => tmp })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <Thread/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/thread/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test.")).toBeInTheDocument();
  });

  // expanded
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

  // thread nav
  const navs = container.querySelectorAll(".threadnav-box");
  expect(navs.length).toBe(2);
  expect(navs[0].style["left"]).toBe("0em");
  expect(navs[1].style["left"]).toBe("0em");
  expect(navs[0].style["border-color"]).toBe("black");
  expect(navs[1].style["border-color"]).toBe("white");
  expect(navs[0].style["border-radius"]).toBe("1em");
  expect(navs[1].style["border-radius"]).toBe("1em");
});

// vim: tabstop=2 shiftwidth=2 expandtab
