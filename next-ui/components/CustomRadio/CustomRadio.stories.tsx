import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import CustomRadio from './CustomRadio';

const meta: Meta<typeof CustomRadio> = {
  title: 'Common/CustomRadio',
  component: CustomRadio,
  tags: ['autodocs'],
  argTypes: {
    checked: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
};

export default meta;
type Story = StoryObj<typeof CustomRadio>;

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
