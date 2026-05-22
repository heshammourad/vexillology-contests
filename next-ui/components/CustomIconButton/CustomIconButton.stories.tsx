import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import CustomIconButton from './CustomIconButton';
import SettingsIcon from '@mui/icons-material/Settings';

const meta: Meta<typeof CustomIconButton> = {
  title: 'Common/CustomIconButton',
  component: CustomIconButton,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'inherit',
        'default',
        'primary',
        'secondary',
        'error',
        'info',
        'success',
        'warning',
      ],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomIconButton>;

export const Default: Story = {
  args: {
    ariaLabel: 'Settings',
    Icon: SettingsIcon,
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    ariaLabel: 'Settings',
    Icon: SettingsIcon,
    color: 'secondary',
  },
};

export const WithLink: Story = {
  args: {
    ariaLabel: 'Settings Link',
    Icon: SettingsIcon,
    href: 'https://example.com',
    color: 'success',
  },
};
