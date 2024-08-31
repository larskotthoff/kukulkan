import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";

import { Write } from "./Write.jsx";

beforeEach(() => {
  global.fetch = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
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
  message_id: "foo",
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

  // default from
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
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
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
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
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

test("reply includes only main part of base message quoted", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = JSON.parse(JSON.stringify(msg))
  msg1.body["text/plain"] = "Thanks.\n\nOn bla, blurg wrote:\n> foo\n> bar.";
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg1 })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("body").querySelector("textarea").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Thanks.\n> [...]`);
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
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
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
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
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

test("files attachable and editable", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=forward'
  });
  const msg1 = JSON.parse(JSON.stringify(msg))
  msg1.attachments = [{"filename": "foofile"}, {"filename": "barfile"}];
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg1 })
        .mockResolvedValueOnce({ ok: true, json: () => allTags })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { container } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  // forwarded attachments present
  expect(screen.getByText("foofile")).toBeInTheDocument();
  expect(screen.getByText("barfile")).toBeInTheDocument();

  // remove attachment
  await userEvent.click(screen.getByText("foofile"));
  expect(screen.queryByText("foofile")).not.toBeInTheDocument();
  expect(screen.getByText("barfile")).toBeInTheDocument();

  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

  // add attachment -- click
  await fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });
  expect(screen.getByText("test.txt (12 Bi)")).toBeInTheDocument();
});

test("localStorage stores for new email", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { container, getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.click(container.querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("foo bar <foo@bar.com>"));

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}");
  await userEvent.type(getByTestId("subject").querySelector("input"), "testsubject");
  await userEvent.type(getByTestId("body").querySelector("textarea"), "testbody");

  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  await fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });

  expect(localStorage.getItem("draft-compose-from")).toBe("foo");
  expect(localStorage.getItem("draft-compose-to")).toBe("to@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-compose-cc")).toBe("cc@test.com");
  expect(localStorage.getItem("draft-compose-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-compose-tags")).toBe("foobar");
  expect(localStorage.getItem("draft-compose-subject")).toBe("testsubject");
  expect(localStorage.getItem("draft-compose-body")).toBe("testbody");
  expect(localStorage.getItem("draft-compose-files")).toBe('{"name":"test.txt","size":12}');
});

test("localStorage stores for reply", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}");
  await userEvent.type(getByTestId("subject").querySelector("input"), " testsubject");
  await userEvent.type(getByTestId("body").querySelector("textarea"), "testbody");

  expect(localStorage.getItem("draft-reply-foo-to")).toBe("bar foo <bar@foo.com>\nto@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-reply-foo-cc")).toBe("test@test.com\ncc@test.com");
  expect(localStorage.getItem("draft-reply-foo-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-reply-foo-tags")).toBe("foo\nbar\ntest\nfoobar");
  expect(localStorage.getItem("draft-reply-foo-subject")).toBe("Re: Test. testsubject");
  expect(localStorage.getItem("draft-reply-foo-body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mailtestbody");
});

test("warns when attempting to send incomplete mail", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tags/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/accounts/");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/templates/");

  await userEvent.click(screen.getByText("Send"));

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(screen.getByText("Error: No to address. Not sending.")).toBeInTheDocument();

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}");
  await userEvent.click(screen.getByText("Send"));

  expect(global.fetch).toHaveBeenCalledTimes(12);
  expect(global.fetch).not.toHaveBeenCalledWith("http://localhost:5000/api/send");
  expect(screen.getByText("Error: No subject. Not sending.")).toBeInTheDocument();
});

test("data assembled correctly for sending new email", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { container, getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}");
  await userEvent.type(getByTestId("subject").querySelector("input"), "testsubject");
  await userEvent.type(getByTestId("body").querySelector("textarea"), "testbody");

  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  await fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({sendStatus: 0, sendOutput: ""}),
    });
  await userEvent.click(screen.getByText("Send"));

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const [url, options] = fetchSpy.mock.calls[0];
  expect(options.body.get("refId")).toBe("null");
  expect(options.body.get("action")).toBe("compose");
  expect(options.body.get("from")).toBe("bar");
  expect(options.body.get("to")).toBe("to@test.com,otherto@test.com");
  expect(options.body.get("cc")).toBe("cc@test.com");
  expect(options.body.get("bcc")).toBe("bcc@test.com");
  expect(options.body.get("tags")).toBe("foobar");
  expect(options.body.get("subject")).toBe("testsubject");
  expect(options.body.get("body")).toBe("testbody");
  expect(options.body.get("attachment-0")).toBe("test.txt");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly for sending reply", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => msg })
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}");
  await userEvent.type(getByTestId("subject").querySelector("input"), " testsubject");
  await userEvent.type(getByTestId("body").querySelector("textarea"), "testbody");

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({sendStatus: 0, sendOutput: ""}),
    });
  await userEvent.click(screen.getByText("Send"));

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const [url, options] = fetchSpy.mock.calls[0];
  expect(options.body.get("refId")).toBe("foo");
  expect(options.body.get("action")).toBe("reply");
  expect(options.body.get("from")).toBe("foo");
  expect(options.body.get("to")).toBe("bar foo <bar@foo.com>,to@test.com,otherto@test.com");
  expect(options.body.get("cc")).toBe("test@test.com,cc@test.com");
  expect(options.body.get("bcc")).toBe("bcc@test.com");
  expect(options.body.get("tags")).toBe("foo,bar,test,foobar");
  expect(options.body.get("subject")).toBe("Re: Test. testsubject");
  expect(options.body.get("body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mailtestbody");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("error when mail cannot be sent", async () => {
  global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => [] })
        .mockResolvedValueOnce({ ok: true, json: () => accounts })
        .mockResolvedValueOnce({ ok: true, json: () => [] }); // templates
  const { container, getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "otherto@test.com{enter}");
  await userEvent.type(getByTestId("subject").querySelector("input"), "testsubject");

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({sendStatus: 1, sendOutput: "foo"}),
    });
  await userEvent.click(screen.getByText("Send"));

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(screen.getByText("Error sending message: foo")).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
