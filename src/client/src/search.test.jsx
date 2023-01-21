import "@testing-library/jest-dom";
import { render, screen, fireEvent } from '@testing-library/react';

import { Search } from './search.jsx';

it('renders', () => {
  render(<Search />);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();
});

it('respects query property', () => {
  render(<Search query={"foobar"}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toHaveValue("foobar");
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();
});

it('has options', () => {
  render(<Search />);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();

  let input = document.querySelector(`input[name="search"]`);
  input.click();
  input.focus();
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("tag:unread");

  fireEvent.change(input, {target: { value: "" }});
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("tag:todo");

  fireEvent.change(input, {target: { value: "" }});
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("date:today");
});

it('gets options from localStorage', () => {
  const localStorageMock = (function() {
    return {
      getItem: function(key) {
        return '["foo:bar"]';
      }
    }
  })()
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  render(<Search />);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();

  let input = document.querySelector(`input[name="search"]`);
  input.click();
  input.focus();
  fireEvent.change(input, {target: { value: "foo" }});
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("foo:bar");
});

it('autocompletes tags', () => {
  render(<Search allTags={["foobar", "barfoo"]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();

  let input = document.querySelector(`input[name="search"]`);
  input.click();
  input.focus();
  fireEvent.change(input, {target: { value: "tag:foo" }});
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("tag:foobar");

  fireEvent.change(input, {target: { value: "tag:foobar and tag:bar" }});
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("tag:foobar and tag:barfoo");
});

it('sets searchParams on submit', () => {
  const setSearchParams = jest.fn();

  render(<Search setSearchParams={setSearchParams}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();

  let input = document.querySelector(`input[name="search"]`);
  input.click();
  input.focus();
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toEqual("tag:unread");
  fireEvent.submit(input);
  expect(setSearchParams).toHaveBeenCalledWith({query: "tag:unread"});
});

// vim: tabstop=2 shiftwidth=2 expandtab
