import type {Meta, StoryObj} from '@storybook/nextjs-vite';
import CategoryLabel from './CategoryLabel';

const meta: Meta<typeof CategoryLabel> = {
  title: 'Common/CategoryLabel',
  component: CategoryLabel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryLabel>;

const mockCategories = ['Flags', 'Heraldry', 'Maps', 'Logos', 'Posters'];

export const Default: Story = {
  args: {
    categories: mockCategories,
    category: 'Flags',
  },
};

export const Heraldry: Story = {
  args: {
    categories: mockCategories,
    category: 'Heraldry',
  },
};

export const WithRank: Story = {
  args: {
    categories: mockCategories,
    category: 'Maps',
    categoryRank: '1',
  },
};

export const UnmatchedCategoryDefaultColor: Story = {
  args: {
    categories: mockCategories,
    category: 'Unknown Category',
  },
};
