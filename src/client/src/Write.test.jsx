import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

import { Write } from "./Write.jsx";

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("exports Write", () => {
  expect(Write).not.toBe(undefined);
});

const allTags = ["foo", "foobar"];
const accounts = [{"id": "foo", "name": "foo bar", "email": "foo@bar.com"},
  {"id": "bar", "name": "blurg", "email": "blurg@foo.com", "default": "true"}];
const msg = {
  from: "bar foo <bar@foo.com>",
  to: "foo bar <foo@bar.com>",
  cc: "test@test.com",
  subject: "Test.",
  date: "Thu, 01 Jan 1970 00:00:00 -0000",
  tags: [ "foo", "bar", "test" ],
  notmuch_id: "fo@o",
  attachments: [],
  body: {
    "text/html": "Test mail in HTML",
    "text/plain": "Test mail"
  }
};

test("renders", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("blurg <blurg@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("Attach")).toBeInTheDocument();
  expect(getByTestId("subject").querySelector("input").value).toBe("");
  expect(document.title).toBe("Compose: New Message");
});

test("selects default account and lists others", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { container } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("blurg <blurg@foo.com>")).toBeInTheDocument();

  await userEvent.click(container.querySelector("div[role='button']"));
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();

  await userEvent.click(screen.getByText("foo bar <foo@bar.com>"));
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("blurg <blurg@foo.com>")).not.toBeInTheDocument();
});

test("base message reply all", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] });// templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(getByTestId("subject").querySelector("input").value).toBe("Re: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").querySelector("textarea").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(document.title).toBe("Compose: Re: Test.");
});

test("base message reply one", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=one'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] });// templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(getByTestId("subject").querySelector("input").value).toBe("Re: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").querySelector("textarea").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(document.title).toBe("Compose: Re: Test.");
});

test("base message forward", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=forward'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] });// templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("bar foo <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(getByTestId("subject").querySelector("input").value).toBe("Fw: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").querySelector("textarea").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(document.title).toBe("Compose: Fw: Test.");
});

test("base message reply filters admin tags", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = JSON.parse(JSON.stringify(msg))
  msg1.tags.push("signed");
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg1 })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] });// templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(screen.queryByText("signed")).not.toBeInTheDocument();
});

test("template set", async () => {
  const templates = [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}];
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => templates });
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(screen.getByText("foobar (2)")).toBeInTheDocument();
  expect(getByTestId("body").querySelector("textarea").value).toBe("");

  await userEvent.click(screen.getByText("foo (1)"));
  expect(getByTestId("body").querySelector("textarea").value).toBe("bar");

  await userEvent.click(screen.getByText("foobar (2)"));
  expect(getByTestId("body").querySelector("textarea").value).toBe("blurg");

  await userEvent.type(document.body, "1");
  expect(getByTestId("body").querySelector("textarea").value).toBe("bar");

  await userEvent.type(document.body, "2");
  expect(getByTestId("body").querySelector("textarea").value).toBe("blurg");
});

test("template set with base message", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const templates = [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}];
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => templates });
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message/foo");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(screen.getByText("foobar (2)")).toBeInTheDocument();
  expect(getByTestId("body").querySelector("textarea").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.click(screen.getByText("foo (1)"));
  expect(getByTestId("body").querySelector("textarea").value).toBe(`bar\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.click(screen.getByText("foobar (2)"));
  expect(getByTestId("body").querySelector("textarea").value).toBe(`blurg\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.type(document.body, "1");
  expect(getByTestId("body").querySelector("textarea").value).toBe(`bar\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.type(document.body, "2");
  expect(getByTestId("body").querySelector("textarea").value).toBe(`blurg\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
});

test("tags editable and complete", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true });

  // remove tag
  await userEvent.click(getByTestId("test"));
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.queryByText("test")).not.toBeInTheDocument();

  // add tag in completion
  const input = getByTestId("tagedit").querySelector("input");
  await userEvent.type(input, "foobar{enter}");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();

  // add tag not in completion
  await userEvent.type(input, "testTag{enter}");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("foobar")).toBeInTheDocument();
  expect(screen.getByText("testTag")).toBeInTheDocument();

  // remove tag
  await userEvent.type(input, "{backspace}");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.queryByText("testTag")).not.toBeInTheDocument();
});

test("addresses editable and complete", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  const input = getByTestId("to").querySelector("input");
  global.fetch.mockResolvedValue({ ok: true, json: () => ["foo@bar.com", "bar@foo.com"] });

  await userEvent.type(input, "foo");
  expect(global.fetch).toHaveBeenCalledTimes(4);
  //expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/foo");
  await userEvent.type(input, "{enter}");
  expect(screen.getByText("foo@bar.com")).toBeInTheDocument();

  await userEvent.click(screen.getByText("foo@bar.com"));
  expect(screen.queryByText("foo@bar.com")).not.toBeInTheDocument();

  await userEvent.type(input, "bar");
  expect(global.fetch).toHaveBeenCalledTimes(5);
  //expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/bar");
  await userEvent.type(input, "{enter}");
  expect(screen.getByText("bar@foo.com")).toBeInTheDocument();
  await userEvent.type(input, "{backspace}");
  expect(screen.queryByText("bar@foo.com")).not.toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  await userEvent.type(input, "aaa@bar.com{enter}");
  expect(global.fetch).toHaveBeenCalledTimes(14);
  expect(screen.getByText("aaa@bar.com")).toBeInTheDocument();
});

test("localStorage stores", async () => {
});

test("files attachable and editable", async () => {
});

test("data assembled correctly for send", async () => {
});

// vim: tabstop=2 shiftwidth=2 expandtab
