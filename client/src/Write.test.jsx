import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { Write } from "./Write.jsx";

// claude helped with this
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
  }

  close() {
  }

  // Method to simulate receiving a message
  simulateMessage(data) {
    if(this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

const msg = {
  from: "bar foo <bar@foo.com>",
  to: ["foo bar <foo@bar.com>"],
  cc: ["test@test.com"],
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

const accts = [{"id": "foo", "name": "foo bar", "email": "foo@bar.com"},
  {"id": "bar", "name": "blurg", "email": "blurg@foo.com", "default": "true"}];

const tags = ["foo", "foobar"];

beforeEach(() => {
  global.fetch = vi.fn();
  vi.stubGlobal('EventSource', MockEventSource);
  localStorage.clear();
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": []});
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

test("renders", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  // default from
  expect(screen.getByText("blurg <blurg@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("Attach")).toBeInTheDocument();
  expect(getByTestId("subject").value).toBe("");
  expect(document.title).toBe("Compose: New Message");
});

test("selects default account and lists others", async () => {
  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("blurg <blurg@foo.com>").selected).toBe(true);

  screen.getByText("foo bar <foo@bar.com>").selected = true;
  await fireEvent.change(screen.getByTestId("from"));
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("blurg <blurg@foo.com>").selected).toBe(false);
});

test("base message reply all", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(getByTestId("subject").value).toBe("Re: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(document.title).toBe("Compose: Re: Test.");
});

test("base message reply all duplicate addresses", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.to = ["bar foo <bar@foo.com>"];
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  let tos = getByTestId("to").querySelectorAll("span");
  expect(tos.length).toBe(1);
  expect(tos[0].value).toBe("bar foo <bar@foo.com>");
});

test("base message reply empty subject", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.subject = "";
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("subject").value).toBe("Re: ");
  expect(document.title).toBe("Compose: Re:");
});

test("base message reply one", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=one'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(getByTestId("subject").value).toBe("Re: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(document.title).toBe("Compose: Re: Test.");
});

test("base message from default if unclear", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.to = ["something@test.com"];
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("from").value).toBe("bar");
});

test("reply includes only main part of base message quoted", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.body["text/plain"] = "Thanks.\n\nOn bla, blurg wrote:\n> foo\n> bar.";
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Thanks.\n> \n> [...]`);
});

test("reply includes entire base message quoted when setting changed", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.body["text/plain"] = "Thanks.\n\nOn bla, blurg wrote:\n> foo\n> bar.";
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  localStorage.setItem("settings-abbreviateQuoted", false);
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Thanks.\n> \n> On bla, blurg wrote:\n> > foo\n> > bar.`);
});

test("base message forward", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=forward'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.queryByText("bar foo <bar@foo.com>")).not.toBeInTheDocument();
  expect(screen.queryByText("test@test.com")).not.toBeInTheDocument();
  expect(getByTestId("subject").value).toBe("Fw: Test.");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
  expect(screen.getByText("Original HTML message")).toBeInTheDocument();
  expect(document.title).toBe("Compose: Fw: Test.");
});

test("forward includes entire message even if abbreviated reply", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=forward'
  });
  const msg1 = structuredClone(msg);
  msg1.body["text/plain"] = "Thanks.\n\nOn bla, blurg wrote:\n> foo\n> bar.";
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  localStorage.setItem("settings-abbreviateQuoted", true);
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Thanks.\n> \n> On bla, blurg wrote:\n> > foo\n> > bar.`);
});

test("base message reply filters admin tags", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.tags.push("signed");
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();
  expect(screen.queryByText("signed")).not.toBeInTheDocument();
});

test("template set", async () => {
  const cmp = {"templates": [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": cmp});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(screen.getByText("foobar (2)")).toBeInTheDocument();
  expect(getByTestId("body").value).toBe("");

  await userEvent.click(screen.getByText("foo (1)"));
  expect(getByTestId("body").value).toBe("bar");

  await userEvent.click(screen.getByText("foobar (2)"));
  expect(getByTestId("body").value).toBe("blurg");

  await userEvent.type(document.body, "1");
  expect(getByTestId("body").value).toBe("bar");

  await userEvent.type(document.body, "2");
  expect(getByTestId("body").value).toBe("blurg");
});

test("template set with base message", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const cmp = {"templates": [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": cmp, "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(screen.getByText("foobar (2)")).toBeInTheDocument();
  expect(getByTestId("body").value).toBe(`\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.click(screen.getByText("foo (1)"));
  expect(getByTestId("body").value).toBe(`bar\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.click(screen.getByText("foobar (2)"));
  expect(getByTestId("body").value).toBe(`blurg\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.type(document.body, "1");
  expect(getByTestId("body").value).toBe(`bar\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);

  await userEvent.type(document.body, "2");
  expect(getByTestId("body").value).toBe(`blurg\n\n\nOn ${msg.date}, ${msg.from} wrote:\n> Test mail`);
});

test("complex template set by click", async () => {
  const tmpl = {"from": "foo", "to": ["to@to.com"], "cc": ["cc@cc.com"], "bcc": ["bcc@bcc.com"],
                "subject": "fooSubject", "tags": ["tag1", "tag2"], "body": "barBody"},
        cmp = {"templates": [{"shortcut": "1", "description": "foo", "template": tmpl}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": cmp});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(getByTestId("from").value).toBe("bar");
  expect(getByTestId("to").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("cc").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("bcc").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("subject").value).toBe("");
  expect(getByTestId("tagedit").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("body").value).toBe("");

  await userEvent.click(screen.getByText("foo (1)"));
  expect(getByTestId("from").value).toBe("foo");
  expect(getByTestId("to").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("to").querySelectorAll(".chip")[0].textContent).toBe("to@to.com");
  expect(getByTestId("cc").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("cc").querySelectorAll(".chip")[0].textContent).toBe("cc@cc.com");
  expect(getByTestId("bcc").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("bcc").querySelectorAll(".chip")[0].textContent).toBe("bcc@bcc.com");
  expect(getByTestId("subject").value).toBe("fooSubject");
  expect(getByTestId("tagedit").querySelectorAll(".chip").length).toBe(2);
  expect(getByTestId("tagedit").querySelectorAll(".chip")[0].textContent).toBe("tag1");
  expect(getByTestId("tagedit").querySelectorAll(".chip")[1].textContent).toBe("tag2");
  expect(getByTestId("body").value).toBe("barBody");
});

test("complex template set by shortcut", async () => {
  const tmpl = {"from": "foo", "to": ["to@to.com"], "cc": ["cc@cc.com"], "bcc": ["bcc@bcc.com"],
                "subject": "fooSubject", "tags": ["tag1", "tag2"], "body": "barBody"},
        cmp = {"templates": [{"shortcut": "1", "description": "foo", "template": tmpl}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": cmp});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(screen.getByText("foo (1)")).toBeInTheDocument();
  expect(getByTestId("from").value).toBe("bar");
  expect(getByTestId("to").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("cc").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("bcc").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("subject").value).toBe("");
  expect(getByTestId("tagedit").querySelectorAll(".chip").length).toBe(0);
  expect(getByTestId("body").value).toBe("");

  await userEvent.type(document.body, "1");
  expect(getByTestId("from").value).toBe("foo");
  expect(getByTestId("to").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("to").querySelectorAll(".chip")[0].textContent).toBe("to@to.com");
  expect(getByTestId("cc").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("cc").querySelectorAll(".chip")[0].textContent).toBe("cc@cc.com");
  expect(getByTestId("bcc").querySelectorAll(".chip").length).toBe(1);
  expect(getByTestId("bcc").querySelectorAll(".chip")[0].textContent).toBe("bcc@bcc.com");
  expect(getByTestId("subject").value).toBe("fooSubject");
  expect(getByTestId("tagedit").querySelectorAll(".chip").length).toBe(2);
  expect(getByTestId("tagedit").querySelectorAll(".chip")[0].textContent).toBe("tag1");
  expect(getByTestId("tagedit").querySelectorAll(".chip")[1].textContent).toBe("tag2");
  expect(getByTestId("body").value).toBe("barBody");
});

test("addresses editable and complete", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  const input = getByTestId("to").querySelector("input");
  global.fetch.mockResolvedValue({ ok: true, json: () => ["foo@bar.com", "bar@foo.com"] });

  await userEvent.type(input, "foo");
  await vi.waitFor(() => {
    expect(screen.getByText("foo@bar.com")).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=foo",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  await userEvent.type(input, "{enter}{enter}");
  expect(screen.getByText("foo@bar.com")).toBeInTheDocument();

  await userEvent.click(screen.getByText("foo@bar.com"));
  expect(screen.queryByText("foo@bar.com")).not.toBeInTheDocument();

  await userEvent.type(input, "bar");
  await vi.waitFor(() => {
    expect(screen.getByText("bar@foo.com")).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bar",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  await userEvent.type(input, "{enter}{enter}");
  expect(screen.getByText("foo@bar.com")).toBeInTheDocument();
  await userEvent.type(input, "{backspace}");
  expect(screen.queryByText("bar@foo.com")).not.toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });
  await userEvent.type(input, "aaa@bar.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=aaa%40bar.com",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  expect(screen.getByText("aaa@bar.com")).toBeInTheDocument();
});

test("tags editable and complete", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

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
  await userEvent.type(input, "foobar{enter}{enter}");
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

test("files attachable and editable", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=forward'
  });
  const msg1 = structuredClone(msg);
  msg1.attachments = [{"filename": "foofile"}, {"filename": "barfile"}];
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  const { container } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  // forwarded attachments present
  expect(screen.getByText("foofile")).toBeInTheDocument();
  expect(screen.getByText("barfile")).toBeInTheDocument();
  expect(screen.getByText("Original HTML message")).toBeInTheDocument();

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
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  screen.getByText("foo bar <foo@bar.com>").selected = true;
  await fireEvent.change(screen.getByTestId("from"));

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), "testsubject");
  await userEvent.type(getByTestId("body"), "testbody");

  expect(global.fetch).toHaveBeenCalledTimes(3);

  expect(localStorage.getItem("draft-compose-from")).toBe("foo");
  expect(localStorage.getItem("draft-compose-to")).toBe("to@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-compose-cc")).toBe("cc@test.com");
  expect(localStorage.getItem("draft-compose-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-compose-tags")).toBe("foobar");
  expect(localStorage.getItem("draft-compose-subject")).toBe("testsubject");
  expect(localStorage.getItem("draft-compose-body")).toBe("testbody");
});

test("localStorage removes empty items", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  // set from
  screen.getByText("foo bar <foo@bar.com>").selected = true;
  await fireEvent.change(screen.getByTestId("from"));

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");

  expect(global.fetch).toHaveBeenCalledTimes(1);

  expect(localStorage.getItem("draft-compose-from")).toBe("foo");
  expect(localStorage.getItem("draft-compose-to")).toBe("to@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-compose-tags")).toBe("foobar");

  // remove addresses and tags
  await userEvent.click(screen.getByText("to@test.com"));
  await userEvent.click(screen.getByText("otherto@test.com"));
  await userEvent.click(screen.getByText("foobar"));

  expect(localStorage.getItem("draft-compose-to")).toBe(null);
  expect(localStorage.getItem("draft-compose-tags")).toBe(null);
});

test("localStorage stores for reply", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(getByTestId("from").value).toBe("foo");
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), " testsubject");
  await userEvent.type(getByTestId("body"), "testbody");

  expect(global.fetch).toHaveBeenCalledTimes(3);

  expect(localStorage.getItem("draft-reply-foo-to")).toBe("bar foo <bar@foo.com>\nto@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-reply-foo-cc")).toBe("test@test.com\ncc@test.com");
  expect(localStorage.getItem("draft-reply-foo-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-reply-foo-tags")).toBe("foo\nbar\ntest\nfoobar");
  expect(localStorage.getItem("draft-reply-foo-subject")).toBe("Re: Test. testsubject");
  expect(localStorage.getItem("draft-reply-foo-body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mailtestbody");
});

test("localStorage deletes upon successful send", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), "testsubject");
  await userEvent.type(getByTestId("body"), "testbody");

  expect(localStorage.getItem("draft-compose-to")).toBe("to@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-compose-cc")).toBe("cc@test.com");
  expect(localStorage.getItem("draft-compose-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-compose-tags")).toBe("foobar");
  expect(localStorage.getItem("draft-compose-subject")).toBe("testsubject");
  expect(localStorage.getItem("draft-compose-body")).toBe("testbody");

  global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({send_id: 0}) });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  expect(global.fetch).toHaveBeenCalledTimes(4);
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(screen.getByText("Message sent.")).toBeInTheDocument();

  expect(localStorage.getItem("draft-compose-to")).toBe(null);
  expect(localStorage.getItem("draft-compose-cc")).toBe(null);
  expect(localStorage.getItem("draft-compose-bcc")).toBe(null);
  expect(localStorage.getItem("draft-compose-tags")).toBe(null);
  expect(localStorage.getItem("draft-compose-subject")).toBe(null);
  expect(localStorage.getItem("draft-compose-body")).toBe(null);
});

test("localStorage deleted with shortcut d", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), "testsubject");
  await userEvent.type(getByTestId("body"), "testbody");

  expect(localStorage.getItem("draft-compose-to")).toBe("to@test.com\notherto@test.com");
  expect(localStorage.getItem("draft-compose-cc")).toBe("cc@test.com");
  expect(localStorage.getItem("draft-compose-bcc")).toBe("bcc@test.com");
  expect(localStorage.getItem("draft-compose-tags")).toBe("foobar");
  expect(localStorage.getItem("draft-compose-subject")).toBe("testsubject");
  expect(localStorage.getItem("draft-compose-body")).toBe("testbody");

  await userEvent.type(document.body, "d");

  expect(localStorage.getItem("draft-compose-to")).toBe(null);
  expect(localStorage.getItem("draft-compose-cc")).toBe(null);
  expect(localStorage.getItem("draft-compose-bcc")).toBe(null);
  expect(localStorage.getItem("draft-compose-tags")).toBe(null);
  expect(localStorage.getItem("draft-compose-subject")).toBe(null);
  expect(localStorage.getItem("draft-compose-body")).toBe(null);
});

test("errors when attempting to send w/o to address", async () => {
  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText("Send"));

  expect(global.fetch).toHaveBeenCalledTimes(0);
  expect(global.fetch).not.toHaveBeenCalledWith("http://localhost:5000/api/send");
  expect(screen.getByText("Error: No to address. Not sending.")).toBeInTheDocument();
});

test("errors when attempting to send w/o subject", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}");
  await userEvent.click(screen.getByText("Send"));

  expect(global.fetch).toHaveBeenCalledTimes(0);
  expect(global.fetch).not.toHaveBeenCalledWith("http://localhost:5000/api/send");
  expect(screen.getByText("Error: No subject. Not sending.")).toBeInTheDocument();
});

test("data assembled correctly for sending new email", async () => {
  const { container, getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), "testsubject");
  await userEvent.type(getByTestId("body"), "testbody");
  expect(global.fetch).toHaveBeenCalledTimes(3);

  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  await fireEvent.change(container.querySelector("input[type=file]"), { target: { files: [file] } });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("refId")).toBe("null");
  expect(options.body.get("action")).toBe("compose");
  expect(options.body.get("from")).toBe("bar");
  expect(options.body.get("to")).toBe("to@test.com\notherto@test.com");
  expect(options.body.get("cc")).toBe("cc@test.com");
  expect(options.body.get("bcc")).toBe("bcc@test.com");
  expect(options.body.get("tags")).toBe("foobar");
  expect(options.body.get("subject")).toBe("testsubject");
  expect(options.body.get("body")).toBe("testbody");
  expect(options.body.get("attachment-0")).toBe(file);

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly for sending new email w/ template", async () => {
  const cmp = {"templates": [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": cmp});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), "testsubject");
  await userEvent.type(document.body, "1");
  expect(getByTestId("body").value).toBe("bar");
  expect(global.fetch).toHaveBeenCalledTimes(3);

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("refId")).toBe("null");
  expect(options.body.get("action")).toBe("compose");
  expect(options.body.get("from")).toBe("bar");
  expect(options.body.get("to")).toBe("to@test.com\notherto@test.com");
  expect(options.body.get("cc")).toBe("cc@test.com");
  expect(options.body.get("bcc")).toBe("bcc@test.com");
  expect(options.body.get("tags")).toBe("foobar");
  expect(options.body.get("subject")).toBe("testsubject");
  expect(options.body.get("body")).toBe("bar");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly for sending reply w/o editing", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("refId")).toBe("foo");
  expect(options.body.get("action")).toBe("reply");
  expect(options.body.get("from")).toBe("foo");
  expect(options.body.get("to")).toBe("bar foo <bar@foo.com>");
  expect(options.body.get("cc")).toBe("test@test.com");
  expect(options.body.get("bcc")).toBe("");
  expect(options.body.get("tags")).toBe("foo,bar,test");
  expect(options.body.get("subject")).toBe("Re: Test.");
  expect(options.body.get("body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mail");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly for sending reply", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("cc").querySelector("input"), "cc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=cc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("bcc").querySelector("input"), "bcc@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=bcc%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  await userEvent.type(getByTestId("tagedit").querySelector("input"), "foobar{enter}{enter}");
  await userEvent.type(getByTestId("subject"), " testsubject");
  await userEvent.type(getByTestId("body"), "testbody");
  expect(global.fetch).toHaveBeenCalledTimes(3);

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("refId")).toBe("foo");
  expect(options.body.get("action")).toBe("reply");
  expect(options.body.get("from")).toBe("foo");
  expect(options.body.get("to")).toBe("bar foo <bar@foo.com>\nto@test.com\notherto@test.com");
  expect(options.body.get("cc")).toBe("test@test.com\ncc@test.com");
  expect(options.body.get("bcc")).toBe("bcc@test.com");
  expect(options.body.get("tags")).toBe("foo,bar,test,foobar");
  expect(options.body.get("subject")).toBe("Re: Test. testsubject");
  expect(options.body.get("body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mailtestbody");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly for sending reply w/ empty subject", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&action=reply&mode=all'
  });
  const msg1 = structuredClone(msg);
  msg1.subject = null;
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": [], "baseMessage": msg1});
  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("subject")).toBe("Re: ");
  expect(options.body.get("body")).toBe("\n\n\nOn Thu, 01 Jan 1970 00:00:00 -0000, bar foo <bar@foo.com> wrote:\n> Test mail");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("data assembled correctly when retrieving from localStorage w/o editing", async () => {
  localStorage.setItem("draft-compose-to", "to@test.com\notherto@test.com");
  localStorage.getItem("draft-compose-to");
  localStorage.setItem("draft-compose-cc", "foo@bar.com");
  localStorage.setItem("draft-compose-subject", "testsubject");
  localStorage.setItem("draft-compose-body", "testbody");

  render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  expect(screen.queryByText("Error: No to address. Not sending.")).not.toBeInTheDocument();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("refId")).toBe("null");
  expect(options.body.get("action")).toBe("compose");
  expect(options.body.get("from")).toBe("bar");
  expect(options.body.get("to")).toBe("to@test.com\notherto@test.com");
  expect(options.body.get("cc")).toBe("foo@bar.com");
  expect(options.body.get("bcc")).toBe("");
  expect(options.body.get("tags")).toBe("");
  expect(options.body.get("subject")).toBe("testsubject");
  expect(options.body.get("body")).toBe("testbody");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("error when mail cannot be sent", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await userEvent.type(getByTestId("subject"), "testsubject");

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 1, send_output: "foo"});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(screen.getByText("Error sending message: foo")).toBeInTheDocument();
});

test("error when mail cannot be sent but no error when successful after", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
  global.fetch.mockResolvedValue({ ok: true, json: () => [] });

  await userEvent.type(getByTestId("to").querySelector("input"), "otherto@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=otherto%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await userEvent.type(getByTestId("subject"), "testsubject");

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 1, send_output: "foo"});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(screen.getByText("Error sending message: foo")).toBeInTheDocument();
  expect(screen.getByTitle("Send")).not.toBeDisabled();

  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(2);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(screen.queryByText("Error sending message: foo")).not.toBeInTheDocument();
  expect(screen.getByText("Message sent.")).toBeInTheDocument();
  expect(screen.getByTitle("Send")).toBeDisabled();
});

test("external editing", async () => {
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": {"external-editor": "foo"}});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, text: () => "foobar" });

  expect(getByTestId("body").value).toBe("");

  await fireEvent.focus(getByTestId("body"));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/edit_external",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(getByTestId("body").value).toBe("[Editing externally...]");

  await vi.waitFor(() => {
    expect(getByTestId("body").value).toBe("foobar");
  });
  expect(localStorage.getItem("draft-compose-body")).toBe("foobar");

  // required fields
  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=to%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  await userEvent.type(getByTestId("subject"), " testsubject");

  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({send_id: 0})
    });
  let eventSourceInstance;
  vi.spyOn(global, 'EventSource').mockImplementation((url) => {
      eventSourceInstance = new MockEventSource(url);
      return eventSourceInstance;
  });
  await userEvent.click(screen.getByText("Send"));
  eventSourceInstance.simulateMessage({send_status: 0, send_output: ""});

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:5000/api/send",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));
  const options = fetchSpy.mock.calls[0][1];
  expect(options.body.get("body")).toBe("foobar");

  expect(screen.getByText("Message sent.")).toBeInTheDocument();
});

test("external editing w/ client config override internal", async () => {
  vi.stubGlobal("data", {"accounts": accts, "allTags": tags, "compose": {"external-editor": "foo"}});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  global.fetch.mockResolvedValue({ ok: true, text: () => "foobar" });

  expect(getByTestId("body").value).toBe("");

  await fireEvent.focus(getByTestId("body"));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/edit_external",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(getByTestId("body").value).toBe("[Editing externally...]");

  await vi.waitFor(() => {
    expect(getByTestId("body").value).toBe("foobar");
  });
  expect(localStorage.getItem("draft-compose-body")).toBe("foobar");

  localStorage.setItem("settings-externalCompose", "0");
  await fireEvent.focus(getByTestId("body"));
  await userEvent.type(getByTestId("body"), "foobar");
  expect(getByTestId("body").value).toBe("foobarfoobar");
  expect(localStorage.getItem("draft-compose-body")).toBe("foobarfoobar");
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("external editing w/ client config override external", async () => {
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  expect(getByTestId("body").value).toBe("");

  await fireEvent.focus(getByTestId("body"));
  await userEvent.type(getByTestId("body"), "bar");
  expect(getByTestId("body").value).toBe("bar");
  expect(global.fetch).toHaveBeenCalledTimes(0);

  localStorage.setItem("settings-externalCompose", "1");

  global.fetch.mockResolvedValue({ ok: true, text: () => "foobar" });

  await fireEvent.focus(getByTestId("body"));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/api/edit_external",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(getByTestId("body").value).toBe("[Editing externally...]");

  await vi.waitFor(() => {
    expect(getByTestId("body").value).toBe("foobar");
  });
  expect(localStorage.getItem("draft-compose-body")).toBe("foobar");
});

test("shortcuts disabled while editing externally", async () => {
  const cmp = {"external-editor": "foo", "templates": [{"shortcut": "1", "description": "foo", "template": "bar"},
                     {"shortcut": "2", "description": "foobar", "template": "blurg"}]};
  vi.stubGlobal("data", {"accounts": accts, "allTags": ["foo", "foobar"], "compose": cmp});
  const { getByTestId } = render(() => <Write/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  // required fields
  await userEvent.type(getByTestId("to").querySelector("input"), "to@test.com{enter}");
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/address/?query=to%40test.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await userEvent.type(getByTestId("subject"), " testsubject");

  global.fetch.mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ text: () => "foobar" });
      }, 100);
    });
  });

  expect(getByTestId("body").value).toBe("");

  await fireEvent.focus(getByTestId("body"));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/edit_external",
    expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }));

  expect(getByTestId("body").value).toBe("[Editing externally...]");

  const fetchSpy = vi.spyOn(global, 'fetch');
  await userEvent.type(document.body, "1");
  expect(getByTestId("body").value).toBe("[Editing externally...]");
  await userEvent.type(document.body, "y");
  expect(fetchSpy).toHaveBeenCalledTimes(0);

  await vi.waitFor(() => {
    expect(getByTestId("body").value).toBe("foobar");
  });
  expect(localStorage.getItem("draft-compose-body")).toBe("foobar");
});

// vim: tabstop=2 shiftwidth=2 expandtab
