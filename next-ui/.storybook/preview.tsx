import React from 'react';
import type {Preview} from '@storybook/nextjs-vite';
import CustomThemeProvider from '../components/CustomThemeProvider';
import {ComponentsStateProvider} from '../context/ComponentsStateContext';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <CustomThemeProvider>
        <ComponentsStateProvider>
          <Story />
        </ComponentsStateProvider>
      </CustomThemeProvider>
    ),
  ],
};

export default preview;
