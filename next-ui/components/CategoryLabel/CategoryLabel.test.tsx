import {render, screen} from '@testing-library/react';
import {expect, test} from 'vitest';
import CategoryLabel from './CategoryLabel';

const mockCategories = ['Flags', 'Heraldry', 'Maps'];

test('renders CategoryLabel with category text', () => {
  render(<CategoryLabel categories={mockCategories} category="Flags" />);
  const labelElement = screen.getByText('Flags');
  expect(labelElement).toBeInTheDocument();
});

test('renders CategoryLabel with category text and rank', () => {
  render(
    <CategoryLabel
      categories={mockCategories}
      category="Heraldry"
      categoryRank="2"
    />,
  );
  const labelElement = screen.getByText('Heraldry');
  const rankElement = screen.getByText('#2');
  expect(labelElement).toBeInTheDocument();
  expect(rankElement).toBeInTheDocument();
});
