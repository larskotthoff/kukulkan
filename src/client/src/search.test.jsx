import "@testing-library/jest-dom";

import { unmountComponentAtNode } from "react-dom";
import { render, screen } from '@testing-library/react';
import { Search } from './search.jsx';

it('renders', () => {
  render(<Search />);
  expect(screen.getByRole('combobox', {type: "text"})).toBeInTheDocument();
  expect(document.querySelector(`input[name="search"]`)).toBeInTheDocument();
  expect(document.getElementsByClassName("kukulkan-queryBox")[0]).toBeInTheDocument();
});

// vim: tabstop=2 shiftwidth=2 expandtab
