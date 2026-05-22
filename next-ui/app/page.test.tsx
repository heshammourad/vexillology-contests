import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import Home from './page';

test('renders next.js home page', () => {
  render(<Home />);
  const heading = screen.getByRole('heading', {
    name: /To get started, edit the page.tsx file./i,
  });
  expect(heading).toBeInTheDocument();
});
