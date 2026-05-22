import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import {FmpIcon, FMP_TEXT} from './Fmp';

const meta: Meta<typeof FmpIcon> = {
  title: 'Common/FmpIcon',
  component: FmpIcon,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'inherit',
        'primary',
        'secondary',
        'action',
        'disabled',
        'error',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FmpIcon>;

export const Default: Story = {
  args: {
    color: 'primary',
    titleAccess: FMP_TEXT,
    sx: {fontSize: 48}, // Make it a bit larger for visibility in Storybook
  },
};

export const ErrorColor: Story = {
  args: {
    color: 'error',
    sx: {fontSize: 48},
  },
};
