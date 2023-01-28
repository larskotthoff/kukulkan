import "@testing-library/jest-dom";
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';

import { TagBar } from './tags.jsx';

it('renders', () => {
  render(<TagBar tagsObject={{tags: []}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();
});

it('renders tags', () => {
  render(<TagBar tagsObject={{tags: ["foo", "bar"]}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  const tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(2);
  expect(within(tags[0]).getByText("foo")).toBeInTheDocument();
  expect(within(tags[1]).getByText("bar")).toBeInTheDocument();
});

it('renders with hidden tags', () => {
  render(<TagBar hiddenTags={["foo"]} tagsObject={{tags: ["foo", "bar"]}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  const tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("bar")).toBeInTheDocument();
});

it('adds tag from options', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
  global.fetch = mockFetch;

  let to = {tags: []};
  render(<TagBar tagsObject={to} options={["foo", "bar"]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let input = document.querySelector(`input`);
  act(() => {
    input.click();
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
  });
  act(() => {
    let option = screen.getByRole("option", {name: "foo"});
    option.click();
  });
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/msg/id/foo");
  await waitFor(() => expect(to.tags).toEqual(["foo"]));
  let tags = screen.getAllByRole('button');
  expect(within(tags[0]).getByText("foo")).toBeInTheDocument();

  fetch.mockReset();
});

it('allows to create new tags', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
  global.fetch = mockFetch;

  let to = {tags: []};
  render(<TagBar tagsObject={to} options={["foo", "bar"]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let input = document.querySelector(`input`);
  act(() => {
    input.click();
    input.focus();
    fireEvent.change(input, {target: {value: "test"}})
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/msg/id/test");
  await waitFor(() => expect(to.tags).toEqual(["test"]));
  let tags = screen.getAllByRole('button');
  expect(within(tags[0]).getByText("test")).toBeInTheDocument();

  fetch.mockReset();
});

it('allows to delete tags', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
  global.fetch = mockFetch;

  let to = {tags: ["foo"]};
  render(<TagBar tagsObject={to} options={["foo", "bar"]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();
  let tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("foo")).toBeInTheDocument();

  let input = document.querySelector(`input`);
  act(() => {
    input.click();
    input.focus();
    fireEvent.keyDown(input, { key: "Backspace" });
  });
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/msg/id/foo");
  await waitFor(() => expect(to.tags).toEqual([]));
  tags = screen.queryByRole('button');
  expect(tags).toBeNull();

  fetch.mockReset();
});

it('removes "unread" on event', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
  global.fetch = mockFetch;

  let to = {tags: ["unread"]};
  render(<TagBar tagsObject={to} options={[]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("unread")).toBeInTheDocument();

  act(() => {
    fireEvent(document.getElementsByClassName("MuiAutocomplete-root")[0], new CustomEvent('read'));
  });
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/msg/id/unread");
  await waitFor(() => expect(to.tags).toEqual([]));
  tags = screen.queryByRole('button');
  expect(tags).toBeNull();

  fetch.mockReset();
});

it('deletes on event', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
  global.fetch = mockFetch;

  let to = {tags: ["unread"]};
  render(<TagBar tagsObject={to} options={[]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("unread")).toBeInTheDocument();

  act(() => {
    fireEvent(document.getElementsByClassName("MuiAutocomplete-root")[0], new CustomEvent('delete'));
  });
  expect(mockFetch).toHaveBeenNthCalledWith(1, "http://localhost:5000/api/tag/remove/msg/id/unread");
  expect(mockFetch).toHaveBeenNthCalledWith(2, "http://localhost:5000/api/tag/add/msg/id/deleted");
  await waitFor(() => expect(to.tags).toEqual(["deleted"]));
  tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("deleted")).toBeInTheDocument();

  fetch.mockReset();
});

it('logs error for tag add', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.reject("error")
  }));
  global.fetch = mockFetch;
  const mockLog = jest.spyOn(console, "warn").mockImplementation();

  let to = {tags: []};
  render(<TagBar tagsObject={to} options={["foo", "bar"]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let input = document.querySelector(`input`);
  act(() => {
    input.click();
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
  });
  act(() => {
    let option = screen.getByRole("option", {name: "foo"});
    option.click();
  });
  await act(async () => {
    await waitFor(() => expect(to.tags).toEqual([]));
  })
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/add/msg/id/foo");
  expect(mockLog).toHaveBeenCalledWith("error");
  let tags = screen.queryByRole('button');
  expect(tags).toBeNull();

  fetch.mockReset();
  mockLog.mockReset();
});

it('logs error for tag remove', async () => {
  const mockFetch = jest.fn(() => Promise.resolve({
    json: () => Promise.reject("error")
  }));
  global.fetch = mockFetch;
  const mockLog = jest.spyOn(console, "warn").mockImplementation();

  let to = {tags: ["foo"]};
  render(<TagBar tagsObject={to} options={["foo", "bar"]} type={"msg"} id={"id"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  let input = document.querySelector(`input`);
  act(() => {
    input.click();
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Backspace" });
  });
  await act(async () => {
    await waitFor(() => expect(to.tags).toEqual(["foo"]));
  })
  expect(mockFetch).toHaveBeenCalledWith("http://localhost:5000/api/tag/remove/msg/id/foo");
  expect(mockLog).toHaveBeenCalledWith("error");
  let tags = screen.getAllByRole('button');
  expect(within(tags[0]).getByText("foo")).toBeInTheDocument();

  fetch.mockReset();
  mockLog.mockReset();
});

// vim: tabstop=2 shiftwidth=2 expandtab
