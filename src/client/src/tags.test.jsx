import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from '@testing-library/react';

import { TagBar } from './tags.jsx';

it('renders', () => {
  render(<TagBar tagsObject={{tags: []}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();
});

it('respects tags', () => {
  render(<TagBar tagsObject={{tags: ["foo", "bar"]}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  const tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(2);
  expect(within(tags[0]).getByText("foo")).toBeInTheDocument();
  expect(within(tags[1]).getByText("bar")).toBeInTheDocument();
});

it('respects hidden tags', () => {
  render(<TagBar hiddenTags={["foo"]} tagsObject={{tags: ["foo", "bar"]}} options={[]}/>);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input`)).toBeInTheDocument();

  const tags = screen.getAllByRole('button');
  expect(tags.length).toEqual(1);
  expect(within(tags[0]).getByText("bar")).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
