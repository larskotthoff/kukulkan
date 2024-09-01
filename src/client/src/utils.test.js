import { test, expect } from "vitest"

import * as utils from "./utils.js";

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
  const now = new Date();
  expect(utils.formatDate(now)).toMatch(/[0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (5 * 24 * 60 * 60 * 1000))))
    .toMatch(/[A-Za-z]{3} [0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (10 * 24 * 60 * 60 * 1000))))
    .toMatch(/[0-9]{1,2}\/[0-9]{1,2} [0-9]{2}:[0-9]{2}/);
  expect(utils.formatDate(new Date(now - (400 * 24 * 60 * 60 * 1000))))
    .toMatch(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4} [0-9]{2}:[0-9]{2}/);
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

// vim: tabstop=2 shiftwidth=2 expandtab
