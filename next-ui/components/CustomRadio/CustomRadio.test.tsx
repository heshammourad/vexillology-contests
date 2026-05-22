import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, test, vi} from 'vitest';
import CustomRadio from './CustomRadio';

test('renders CustomRadio with default state', () => {
  render(<CustomRadio />);
  const radioElement = screen.getByRole('radio');
  expect(radioElement).toBeInTheDocument();
  expect(radioElement).not.toBeChecked();
});

test('renders CustomRadio in checked state', () => {
  render(<CustomRadio checked onChange={() => {}} />);
  const radioElement = screen.getByRole('radio');
  expect(radioElement).toBeChecked();
});

test('handles change events when clicked', async () => {
  const handleChange = vi.fn();
  render(<CustomRadio onChange={handleChange} />);
  const radioElement = screen.getByRole('radio');

  await userEvent.click(radioElement);
  expect(handleChange).toHaveBeenCalledTimes(1);
});

test('respects disabled state', async () => {
  const handleChange = vi.fn();
  render(<CustomRadio disabled onChange={handleChange} />);
  const radioElement = screen.getByRole('radio');

  expect(radioElement).toBeDisabled();
  const user = userEvent.setup({pointerEventsCheck: 0});
  await user.click(radioElement);
  expect(handleChange).not.toHaveBeenCalled();
});
