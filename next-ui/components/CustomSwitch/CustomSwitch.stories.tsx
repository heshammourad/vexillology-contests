import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import CustomSwitch from './CustomSwitch';

const meta: Meta<typeof CustomSwitch> = {
  title: 'Common/CustomSwitch',
  component: CustomSwitch,
  tags: ['autodocs'],
  argTypes: {
    checked: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
};

export default meta;
type Story = StoryObj<typeof CustomSwitch>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: false,
  },
};

export const CheckedDisabled: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};
