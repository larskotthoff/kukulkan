import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

import { SingleMessage, Message } from "./Message.jsx";

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

const msg = {
  from: "foo bar <foo@bar.com>",
  to: "bar foo <bar@foo.com>",
  cc: "test@test.com",
  subject: "Test.",
  date: "Thu, 01 Jan 1970 00:00:00 -0000",
  tags: [ "foo", "bar", "test" ],
  attachments: [],
  body: {
    "text/html": "<i>Test mail</i>",
    "text/plain": "Test mail"
  }
}

test("exports SingleMessage and Message", () => {
  expect(SingleMessage).not.toBe(undefined);
  expect(Message).not.toBe(undefined);
});

// this should work, but doesn't
//test("shows error when fetch fails", async () => {
//  global.fetch.mockRejectedValue(new Error("foo"));
//  const { container } = render(() => <SingleMessage/>);
//  expect(global.fetch).toHaveBeenCalledTimes(1);
//  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
//
//  await vi.waitFor(() => {
//    expect(screen.getByText("Error querying backend: Error: foo")).toBeInTheDocument();
//  });
//});

test("fetches and renders message", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => ["foo", "foobar"] });
  const { container } = render(() => <SingleMessage/>);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");

  await vi.waitFor(() => {
    expect(screen.getByText("Test.")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(document.title).toBe("Test.");
});

test("renders message components", () => {
  const { container } = render(() => <Message msg={msg}/>);
  expect(screen.getByText("Test.")).toBeInTheDocument();
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
