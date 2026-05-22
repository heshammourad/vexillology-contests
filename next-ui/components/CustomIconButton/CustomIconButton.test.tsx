import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect, test, vi} from 'vitest';
import CustomIconButton from './CustomIconButton';
import SettingsIcon from '@mui/icons-material/Settings';

test('renders CustomIconButton with specified icon and aria-label', () => {
  render(<CustomIconButton ariaLabel="settings-btn" Icon={SettingsIcon} />);
  const button = screen.getByRole('button', {name: 'settings-btn'});
  expect(button).toBeInTheDocument();
});

test('handles click events', async () => {
  const handleClick = vi.fn();
  render(
    <CustomIconButton
      ariaLabel="settings-btn"
      Icon={SettingsIcon}
      onClick={handleClick}
    />,
  );
  const button = screen.getByRole('button', {name: 'settings-btn'});

  await userEvent.click(button);
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('respects href and targets', () => {
  render(
    <CustomIconButton
      ariaLabel="settings-btn"
      Icon={SettingsIcon}
      href="https://example.com"
    />,
  );
  const linkButton = screen.getByRole('link', {name: 'settings-btn'});
  expect(linkButton).toBeInTheDocument();
  expect(linkButton).toHaveAttribute('href', 'https://example.com');
  expect(linkButton).toHaveAttribute('target', 'vexillology-contests');
});
