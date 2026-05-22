import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import CustomBadge from './CustomBadge';
import MailIcon from '@mui/icons-material/Mail';

const meta: Meta<typeof CustomBadge> = {
  title: 'Common/CustomBadge',
  component: CustomBadge,
  tags: ['autodocs'],
  argTypes: {
    invisible: {control: 'boolean'},
    overlap: {
      control: 'select',
      options: ['circular', 'rectangular'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomBadge>;

export const Default: Story = {
  args: {
    children: <MailIcon color="action" />,
    invisible: false,
    overlap: 'rectangular',
  },
};

export const CircularOverlap: Story = {
  args: {
    children: (
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#7295fc',
          borderRadius: '50%',
        }}
      />
    ),
    invisible: false,
    overlap: 'circular',
  },
};

export const Invisible: Story = {
  args: {
    children: <MailIcon color="action" />,
    invisible: true,
  },
};
