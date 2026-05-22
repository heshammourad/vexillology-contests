import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vitest/config';

import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';

import {playwright} from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({configDir: path.join(dirname, '.storybook')}),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{browser: 'chromium'}],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: [path.join(dirname, 'vitest.setup.ts')],
          include: ['**/*.test.{ts,tsx,js,jsx}'],
          exclude: ['**/node_modules/**', '**/.next/**'],
        },
      },
    ],
  },
});
