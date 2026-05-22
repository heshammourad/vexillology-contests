import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import LoadingContent from './LoadingContent';

const meta: Meta<typeof LoadingContent> = {
  title: 'Common/LoadingContent',
  component: LoadingContent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingContent>;

export const Loading: Story = {
  args: {
    loading: true,
    children: <div>This is some content that is hidden while loading!</div>,
  },
};

export const NotLoading: Story = {
  args: {
    loading: false,
    children: (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
        }}>
        This is the loaded content!
      </div>
    ),
  },
};
