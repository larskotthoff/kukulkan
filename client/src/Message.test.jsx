import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
import { screen } from "shadow-dom-testing-library";
import { userEvent } from "@testing-library/user-event";

import { FetchedMessage, Message, separateQuotedNonQuoted } from "./Message.jsx";

const msg = {
  from: "foo bar <foo@bar.com>",
  to: ["bar foo <bar@foo.com>"],
  cc: ["test@test.com"],
  subject: "Test.",
  date: "Thu, 01 Jan 1970 00:00:00 -0000",
  tags: [ "foo", "bar", "test" ],
  notmuch_id: "fo@o",
  attachments: [],
  body: {
    "text/html": true,
    "text/plain": "Test mail"
  }
};

const tags = ["foo", "bar"];

beforeEach(() => {
  vi.spyOn(window, "open").mockImplementation(() => {});
  global.fetch = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = function() {};
  vi.stubGlobal("data", {"allTags": tags, "message": msg});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("exports FetchedMessage and Message", () => {
  expect(FetchedMessage).not.toBe(undefined);
  expect(Message).not.toBe(undefined);
});

test("fetches and renders message", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo'
  });
  render(() => <FetchedMessage/>);

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

test("fetches and renders attached message", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?id=foo&attachNum=0'
  });
  render(() => <FetchedMessage/>);

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

test("fetches and renders message in print view", async () => {
  vi.stubGlobal('location', {
    ...window.location,
    search: '?message=foo&print=true'
  });
  render(() => <FetchedMessage/>);

  await vi.waitFor(() => {
    expect(screen.getByText("Test.")).toBeInTheDocument();
  });
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.queryByText("foo")).not.toBeInTheDocument();
  expect(screen.queryByText("bar")).not.toBeInTheDocument();
  expect(screen.queryByText("test")).not.toBeInTheDocument();

  expect(document.title).toBe("Test.");
});

test("renders message components", () => {
  const { container } = render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("Test.")).toBeInTheDocument();
  expect(screen.getByText("foo bar <foo@bar.com>")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();
  expect(screen.getByText("test@test.com")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  expect(container.querySelector("a[href='/write?action=reply&message=fo%40o&mode=all']")).not.toBe(null);
  expect(container.querySelector("a[href='/write?action=forward&message=fo%40o']")).not.toBe(null);
  expect(container.querySelector("a[href='/message?message=fo%40o&print=true']")).not.toBe(null);
  expect(container.querySelector("a[href='http://localhost:5000/api/message_auth/?message=fo%40o']")).not.toBe(null);
});

test("renders additional message components", () => {
  const msg1 = structuredClone(msg);
  msg1.reply_to = "Reply@to";
  msg1.forwarded_to = "Forwarded@to";
  msg1.bcc = ["BCC@BCC"];

  render(() => <Message msg={msg1} active={true}/>);
  expect(screen.getByText("Reply@to")).toBeInTheDocument();
  expect(screen.getByText("Forwarded@to")).toBeInTheDocument();
  expect(screen.getByText("BCC@BCC")).toBeInTheDocument();
});

test("renders message text with <>", () => {
  const msg1 = structuredClone(msg);
  msg1.body["text/plain"] = "Test <test>";

  render(() => <Message msg={msg1} active={true}/>);
  expect(screen.getByText("Test <test>")).toBeInTheDocument();
});

test("renders message without date", () => {
  const msg1 = structuredClone(msg);
  msg1.date = null;

  render(() => <Message msg={msg1} active={true}/>);
  expect(screen.getByText("(no date)")).toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
});

test("renders message signature", () => {
  msg.signature = { valid: true, message: "" };
  let { container } = render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("Signature verified.")).toBeInTheDocument();
  expect(container.querySelector(".alert")).not.toBe(null);
  cleanup();

  msg.signature = { valid: null, message: "unknown cert" };
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(screen.getByText("Signature could not be verified (unknown cert).")).toBeInTheDocument();
  expect(container.querySelector(".alert")).not.toBe(null);
  cleanup();

  msg.signature = { valid: false, message: "checksum failure" };
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(screen.getByText("Signature verification failed (checksum failure).")).toBeInTheDocument();
  expect(container.querySelector(".alert")).not.toBe(null);
});

test("renders message attachments", () => {
  // image
  msg.attachments = [ { content_type: "image", filename: "foo.jpg" } ];
  let { container } = render(() => <Message msg={msg} active={true}/>);
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(container.querySelector("img[src='http://localhost:5000/api/attachment/?message=fo%40o&num=0&scale=1'][alt='foo.jpg']")).not.toBe(null);
  cleanup();

  // calendar
  msg.attachments = [ { content_type: "calendar", content_size: 100, filename: "foo.txt",
    preview: { summary: "foo", location: "bar", start: "1000086400", end:
      "1000086500", attendees: "attend", recur: "recur" }} ];
  vi.stubEnv('TZ', 'America/Denver')
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(container.querySelector("a[href='https://www.google.com/calendar/render?action=TEMPLATE&text=foo&dates=undefined/undefined&location=bar&ctz=undefined&recur=RRULE:undefined&sf=true&output=xml']")).not.toBe(null);
  expect(screen.getByText("foo.txt (100 Bi, calendar)")).toBeInTheDocument();
  expect(screen.getByText("foo (bar) 9/9/2001 19:46 — 9/9/2001 19:48 attend recur")).toBeInTheDocument();
  vi.unstubAllEnvs();
  cleanup();

  // calendar -- different timezone
  vi.stubEnv('TZ', 'America/New_York')
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(container.querySelector("a[href='https://www.google.com/calendar/render?action=TEMPLATE&text=foo&dates=undefined/undefined&location=bar&ctz=undefined&recur=RRULE:undefined&sf=true&output=xml']")).not.toBe(null);
  expect(screen.getByText("foo.txt (100 Bi, calendar)")).toBeInTheDocument();
  expect(screen.getByText("foo (bar) 9/9/2001 21:46 — 9/9/2001 21:48 attend recur")).toBeInTheDocument();
  vi.unstubAllEnvs();
  cleanup();

  // nested message
  msg.attachments = [ { content_type: "message/rfc822", content_size: 100, filename: "bar.txt" } ];
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='/message?id=fo%40o&attachNum=0']")).not.toBe(null);
  expect(screen.getByText("bar.txt (100 Bi, message/rfc822)")).toBeInTheDocument();
  cleanup();

  // other
  msg.attachments = [ { content_type: "text", content_size: 100, filename: "foo.txt" } ];
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(screen.getByText("foo.txt (100 Bi, text)")).toBeInTheDocument();
  cleanup();

  // multiple
  msg.attachments = [ { content_type: "text", content_size: 100, filename: "foo.txt" },
    { content_type: "text", content_size: 10000, filename: "bar.txt" } ];
  container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(screen.getByText("foo.txt (100 Bi, text)")).toBeInTheDocument();
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=1']")).not.toBe(null);
  expect(screen.getByText("bar.txt (9.77 kiB, text)")).toBeInTheDocument();
});

test("smime attachment hidden when collapsed", () => {
  msg.attachments = [ { content_type: "signed", content_size: 100, filename: "smime.p7s" },
    { content_type: "text", content_size: 10000, filename: "test.txt" } ];

  // shown when message active
  let container = render(() => <Message msg={msg} active={true}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).not.toBe(null);
  expect(screen.getByText("smime.p7s (100 Bi, signed)")).toBeInTheDocument();
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=1']")).not.toBe(null);
  expect(screen.getByText("test.txt (9.77 kiB, text)")).toBeInTheDocument();
  cleanup();

  // hidden when message not active
  container = render(() => <Message msg={msg} active={false}/>).container;
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=0']")).toBe(null);
  expect(screen.queryByText("smime.p7s (100 Bi, signed)")).not.toBeInTheDocument();
  expect(container.querySelector("a[href='http://localhost:5000/api/attachment/?message=fo%40o&num=1']")).not.toBe(null);
  expect(screen.getByText("test.txt")).toBeInTheDocument();
});

test("links are linkified in text", () => {
  const msg1 = structuredClone(msg);
  msg1.body = {
    "text/html": false,
    "text/plain": "http://www.foobar.com."
  };

  const { container } = render(() => <Message msg={msg1} active={true}/>);
  expect(container.querySelector("a[href='http://www.foobar.com']")).not.toBe(null);
  expect(screen.getByText("http://www.foobar.com")).toBeInTheDocument();
});

test("allows to switch between text and HTML", async () => {
  const { getByTestId } = render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("bar foo <bar@foo.com>")).toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true, text: () => "Test mail in HTML" });

  await userEvent.click(getByTestId("HTML"));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/message_html/?message=fo%40o");

  expect(screen.getByShadowText("Test mail in HTML")).toBeInTheDocument();
  expect(screen.queryByText("Test mail")).not.toBeInTheDocument();

  await userEvent.click(getByTestId("Text"));
  expect(screen.queryByShadowText("Test mail in HTML")).not.toBeInTheDocument();
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("allows to edit tags", async () => {
  const { container, getByTestId } = render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("test")).toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true });

  // remove tag
  await userEvent.click(getByTestId("test"));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-test");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.queryByText("test")).not.toBeInTheDocument();

  // add tag
  const input = container.querySelector("input");
  await userEvent.type(input, "testTag{enter}");
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-test");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=testTag");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.getByText("testTag")).toBeInTheDocument();

  // remove tag
  await userEvent.type(input, "{backspace}");
  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-test");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=testTag");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-testTag");
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("bar")).toBeInTheDocument();
  expect(screen.queryByText("testTag")).not.toBeInTheDocument();
});

test("automatically removes unread tag", async () => {
  msg.tags = ["foo", "unread"];
  render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("unread")).toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true });
  await vi.waitFor(() => {
    expect(screen.queryByText("unread")).not.toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-unread");

  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.queryByText("unread")).not.toBeInTheDocument();
});

test("delete shortcut works", async () => {
  msg.tags = ["foo", "unread"];
  render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("foo")).toBeInTheDocument();
  expect(screen.getByText("unread")).toBeInTheDocument();

  global.fetch.mockResolvedValue({ ok: true });
  await userEvent.type(document.body, "{delete}");
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/tag_batch/?type=message&ids=fo%40o&tags=-unread%20deleted");
  expect(screen.queryByText("unread")).not.toBeInTheDocument();
  expect(screen.getByText("deleted")).toBeInTheDocument();
});

test("click expands and collapses quoted text", async () => {
  msg.body = {
    "text/html": true,
    "text/plain": "Test mail\n\n> quoted text bla bla bla"
  }
  const { container } = render(() => <Message msg={msg} active={true}/>);
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("> quoted text bla bla bla")).toBeInTheDocument();
  expect(container.querySelector(".text-preview")).not.toBe(null);

  await userEvent.click(container.querySelector(".text-preview"));
  expect(screen.getByText("Test mail")).toBeInTheDocument();
  expect(screen.getByText("> quoted text bla bla bla")).toBeInTheDocument();
});

test("segments into main and quoted correctly", () => {
  let mp = "Test\n",
      qp = "> foo",
      res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);

  mp = "Test\n> quote\ninline reply";
  qp = "> foo";
  res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);

  mp = "Test\n";
  qp = "----\nsig";
  res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);

  mp = "Test\n";
  qp = "On Saturday, foo wrote:\ntext";
  res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);

  mp = "Test\n";
  qp = "From: foo\nbar";
  res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);

  mp = "Test\n";
  qp = "-----Original Message-----\nbla bla";
  res = separateQuotedNonQuoted(`${mp}\n${qp}`);
  expect(res.mainPart).toBe(mp);
  expect(res.quotedPart).toBe(qp);
});

// vim: tabstop=2 shiftwidth=2 expandtab
