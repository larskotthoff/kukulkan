import { afterEach, beforeEach, test, expect } from "vitest";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";

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
  expect(getSetting("openInTab")).toBe("_self");
  expect(getSetting("showNestedThread")).toBe(true);
  expect(getSetting("externalCompose")).toBe("-1");
  expect(getSetting("abbreviateQuoted")).toBe(true);
  expect(getSetting("showSerpent")).toBe(false);
});

test("shows settings", () => {
  render(() => <Settings/>);
  expect(screen.getByTestId("numQueries")).toBeInTheDocument();
  expect(screen.getByTestId("openInTab")).toBeInTheDocument();
  expect(screen.getByTestId("showNestedThread")).toBeInTheDocument();
  expect(screen.getByTestId("externalCompose")).toBeInTheDocument();
  expect(screen.getByTestId("abbreviateQuoted")).toBeInTheDocument();
  expect(screen.getByTestId("showSerpent")).toBeInTheDocument();
});

test("allows to change settings", async () => {
  render(() => <Settings/>);
  expect(getSetting("numQueries")).toBe(10);
  screen.getByTestId("numQueries").value = 1;
  await fireEvent.change(screen.getByTestId("numQueries"));
  expect(getSetting("numQueries")).toBe(1);

  expect(getSetting("openInTab")).toBe("_self");
  screen.getByText("new").selected = true;
  await fireEvent.change(screen.getByTestId("openInTab"));
  expect(getSetting("openInTab")).toBe("_blank");

  expect(getSetting("showNestedThread")).toBe(true);
  screen.getByText("flattened").selected = true;
  await fireEvent.change(screen.getByTestId("showNestedThread"));
  expect(getSetting("showNestedThread")).toBe(false);

  expect(getSetting("externalCompose")).toBe("-1");
  screen.getByText("internal browser editor").selected = true;
  await fireEvent.change(screen.getByTestId("externalCompose"));
  expect(getSetting("externalCompose")).toBe("0");
  screen.getByText("external editor on localhost").selected = true;
  await fireEvent.change(screen.getByTestId("externalCompose"));
  expect(getSetting("externalCompose")).toBe("1");

  expect(getSetting("abbreviateQuoted")).toBe(true);
  screen.getByText("show in full").selected = true;
  await fireEvent.change(screen.getByTestId("abbreviateQuoted"));
  expect(getSetting("abbreviateQuoted")).toBe(false);

  expect(getSetting("showSerpent")).toBe(false);
  screen.getByText("Do").selected = true;
  await fireEvent.change(screen.getByTestId("showSerpent"));
  expect(getSetting("showSerpent")).toBe(true);
});

// vim: tabstop=2 shiftwidth=2 expandtab
