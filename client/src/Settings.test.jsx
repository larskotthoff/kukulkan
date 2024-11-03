import { afterEach, beforeEach, test, expect } from "vitest";
import { cleanup, render, screen } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";

import { getSetting, Settings } from "./Settings.jsx";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("exports Settings", () => {
  expect(Settings).not.toBe(undefined);
});

test("gets settings", () => {
  expect(getSetting("numQueries")).toBe(10);
  expect(getSetting("openInTab")).toBe("_blank");
  expect(getSetting("showNestedThread")).toBe(true);
  expect(getSetting("externalCompose")).toBe(-1);
  expect(getSetting("abbreviateQuoted")).toBe(true);
});

test("shows settings", () => {
  render(() => <Settings/>);
  expect(screen.getByTestId("numQueries")).toBeInTheDocument();
  expect(screen.getByTestId("openInTab")).toBeInTheDocument();
  expect(screen.getByTestId("showNestedThread")).toBeInTheDocument();
  expect(screen.getByTestId("externalCompose")).toBeInTheDocument();
  expect(screen.getByTestId("abbreviateQuoted")).toBeInTheDocument();
});

test("allows to change settings", async () => {
  render(() => <Settings/>);
  expect(getSetting("numQueries")).toBe(10);
  await userEvent.type(screen.getByTestId("numQueries").querySelector("input"), "1");
  expect(getSetting("numQueries")).toBe(101);

  expect(getSetting("openInTab")).toBe("_blank");
  await userEvent.click(screen.getByTestId("openInTab").querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("same"));
  expect(getSetting("openInTab")).toBe("_self");

  expect(getSetting("showNestedThread")).toBe(true);
  await userEvent.click(screen.getByTestId("showNestedThread").querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("flattened"));
  expect(getSetting("showNestedThread")).toBe(false);

  expect(getSetting("externalCompose")).toBe(-1);
  await userEvent.click(screen.getByTestId("externalCompose").querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("internal browser editor"));
  expect(getSetting("externalCompose")).toBe(false);
  await userEvent.click(screen.getByTestId("externalCompose").querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("external editor on localhost"));
  expect(getSetting("externalCompose")).toBe(true);

  expect(getSetting("abbreviateQuoted")).toBe(true);
  await userEvent.click(screen.getByTestId("abbreviateQuoted").querySelector("div[role='button']"));
  await userEvent.click(screen.getByText("show in full"));
  expect(getSetting("abbreviateQuoted")).toBe(false);
});

// vim: tabstop=2 shiftwidth=2 expandtab
