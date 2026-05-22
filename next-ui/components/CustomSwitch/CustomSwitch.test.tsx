import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, test, vi} from 'vitest';
import CustomSwitch from './CustomSwitch';

test('renders CustomSwitch with default state', () => {
  render(<CustomSwitch data-testid="custom-switch" />);
  const switchElement = screen.getByRole('switch');
  expect(switchElement).toBeInTheDocument();
  expect(switchElement).not.toBeChecked();
});

test('renders CustomSwitch in checked state', () => {
  render(<CustomSwitch checked onChange={() => {}} />);
  const switchElement = screen.getByRole('switch');
  expect(switchElement).toBeChecked();
});

test('handles change events when toggled', async () => {
  const handleChange = vi.fn();
  render(<CustomSwitch onChange={handleChange} />);
  const switchElement = screen.getByRole('switch');

  await userEvent.click(switchElement);
  expect(handleChange).toHaveBeenCalledTimes(1);
});

test('respects disabled state', async () => {
  const handleChange = vi.fn();
  render(<CustomSwitch disabled onChange={handleChange} />);
  const switchElement = screen.getByRole('switch');

  expect(switchElement).toBeDisabled();
  const user = userEvent.setup({pointerEventsCheck: 0});
  await user.click(switchElement);
  expect(handleChange).not.toHaveBeenCalled();
});
