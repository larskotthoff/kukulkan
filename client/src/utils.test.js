import { afterEach, beforeEach, expect, test, vi } from "vitest";

import * as utils from "./utils.js";

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});


test("getColor", () => {
  expect(utils.getColor("foo")).toBe("#c70579");
  expect(utils.getColor("bar")).toBe("#c705aa");
});

test("strip", () => {
  expect(utils.strip("<p>foo</p>")).toBe("foo");
  expect(utils.strip("<p>foo</p>\n<p>bar</p>")).toBe("foo\nbar");
});

test("extractEmailsSort", () => {
  expect(utils.extractEmailsSort("foo@bar.com")).toBe(".@abcfmooor");
  expect(utils.extractEmailsSort("FOO@bar.com")).toBe(".@abcfmooor");
  expect(utils.extractEmailsSort("<foo@bar.com>")).toBe(".@abcfmooor");
  expect(utils.extractEmailsSort("Foo Bar <foo@bar.com>")).toBe(".@abcfmooor");
  expect(utils.extractEmailsSort("'Foo Bar' <foo@bar.com>")).toBe(".@abcfmooor");
  expect(utils.extractEmailsSort("\"Foo Bar\" <foo@bar.com>")).toBe(".@abcfmooor");
});

test("filterAdminTags", () => {
  expect(utils.filterAdminTags(["foo", "bar", "replied", "sent", "signed", "passed", "attachment"]))
    .toStrictEqual(["foo", "bar"]);
  expect(utils.filterAdminTags(undefined)).toStrictEqual(undefined);
});

test("filterSubjectColor", () => {
  expect(utils.filterSubjectColor("Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("Re: Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("RE:Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("FW: Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("Aw:Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("Fwd: Foo Bar")).toBe("Foo Bar");
  expect(utils.filterSubjectColor("Fwd Foo Bar")).toBe("Fwd Foo Bar");
});

test("formatDate", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 6, 1));
  const now = new Date();
  expect(utils.formatDate(now)).toMatch(/[0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (5 * 24 * 60 * 60 * 1000))))
    .toMatch(/[A-Za-z]{3} [0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (10 * 24 * 60 * 60 * 1000))))
    .toMatch(/[0-9]{1,2}\/[0-9]{1,2} [0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (400 * 24 * 60 * 60 * 1000))))
    .toMatch(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4} [0-9]{2}:[0-9]{2}/);
  vi.useRealTimers();
});

test("formatDuration", () => {
  const now = new Date();
  expect(utils.formatDuration(new Date(now - (30 * 60 * 1000)), now))
    .toBe("30分");
  expect(utils.formatDuration(new Date(now - (2 * 60 * 60 * 1000)), now))
    .toBe("2時");
  expect(utils.formatDuration(new Date(now - (2 * 24 * 60 * 60 * 1000)), now))
    .toBe("2日");
  expect(utils.formatDuration(new Date(now - (2 * 7 * 24 * 60 * 60 * 1000)), now))
    .toBe("2週");
  expect(utils.formatDuration(new Date(now - (4 * 30 * 24 * 60 * 60 * 1000)), now))
    .toBe("4月");
  expect(utils.formatDuration(new Date(now - (2 * 365 * 24 * 60 * 60 * 1000)), now))
    .toBe("2年");
});

test("renderDateNumThread", () => {
  const now = new Date(),
        thread = { total_messages: 1, newest_date: now,
          oldest_date: new Date(now - (24 * 60 * 60 * 1000)) };

  expect(utils.renderDateNumThread(thread).join(" ")).toMatch(/[0-9]{2}:[0-9]{2}/);

  thread.total_messages = 2;
  expect(utils.renderDateNumThread(thread).join(" ")).toMatch(/[0-9]{2}:[0-9]{2} \(2\/24時\)/);

  expect(utils.renderDateNumThread(thread)[0]).not.toMatch(/[0-9]{2}:[0-9]{2} \(2\/24時\)/);
  expect(utils.renderDateNumThread(thread)[0]).toMatch(/[0-9]{2}:[0-9]{2}/);
});

test("apiURL", () => {
  expect(utils.apiURL("foo")).toBe("http://localhost:5000/foo");

  process.env.NODE_ENV = "production";
  expect(utils.apiURL("foo")).toBe("/foo");
});

test("formatFSz", () => {
  expect(utils.formatFSz(1000)).toBe("1000 Bi");
  expect(utils.formatFSz(1024 * 1.5)).toBe("1.5 kiB");
  expect(utils.formatFSz(1024 * 1024 * 1.5)).toBe("1.5 MiB");
  expect(utils.formatFSz(1024 * 1024 * 1024 * 1.5)).toBe("1.5 GiB");
  expect(utils.formatFSz(1024 * 1024 * 1024 * 1024 * 1.5)).toBe("1.5 TiB");
});

test("splitAddressHeader", () => {
  expect(utils.splitAddressHeader(null)).toStrictEqual(["@", "(no author)", "(none)"]);
  expect(utils.splitAddressHeader("foo@bar.com")).toStrictEqual(["foo@bar.com", "foo@bar.com", "foo@bar.com"]);
  expect(utils.splitAddressHeader("<foo@bar.com>")).toStrictEqual(["foo@bar.com", "foo@bar.com", "foo@bar.com"]);
  expect(utils.splitAddressHeader("<FOO@bar.com>")).toStrictEqual(["foo@bar.com", "FOO@bar.com", "FOO@bar.com"]);

  expect(utils.splitAddressHeader("Foo Bar <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Foo Bar", "Foo"]);
  expect(utils.splitAddressHeader("'Foo Bar' <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Foo Bar", "Foo"]);
  expect(utils.splitAddressHeader("\"Foo Bar\" <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Foo Bar", "Foo"]);

  expect(utils.splitAddressHeader("Bar, Foo <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Bar, Foo", "Foo"]);
  expect(utils.splitAddressHeader("'Bar, Foo' <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Bar, Foo", "Foo"]);
  expect(utils.splitAddressHeader("\"Bar, Foo\" <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Bar, Foo", "Foo"]);

  expect(utils.splitAddressHeader("Many long names <foo@bar.com>")).toStrictEqual(["foo@bar.com", "Many long names", "Many"]);
});

test("delayedDebouncedFetch", async () => {

  global.fetch.mockResolvedValue({ ok: true, json: () => ["foo", "bar"] });
  const res = await utils.delayedDebouncedFetch("foo", 100)

  expect(res).toStrictEqual(["foo", "bar"]);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith("foo",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));

  vi.useFakeTimers();
  utils.delayedDebouncedFetch("foobar", 200)
  vi.advanceTimersByTime(100);
  utils.delayedDebouncedFetch("bar", 100)
  vi.advanceTimersByTime(200);
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch).not.toHaveBeenCalledWith("foobar",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  expect(global.fetch).toHaveBeenCalledWith("bar",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  vi.useRealTimers();
});

// vim: tabstop=2 shiftwidth=2 expandtab
