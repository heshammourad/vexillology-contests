'use client';

import {createTheme} from '@mui/material/styles';

// Extend Material UI Palette types with TypeScript Module Augmentation
declare module '@mui/material/styles' {
  interface Palette {
    flagMakerPrint: {
      main: string;
    };
  }
  interface PaletteOptions {
    flagMakerPrint?: {
      main: string;
    };
  }

  interface PaletteColor {
    ultralight?: string;
  }
  interface SimplePaletteColorOptions {
    ultralight?: string;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      dark: '#c10000',
      light: '#ff7c4c',
      main: '#fc471e',
      ultralight: '#ffdad1',
    },
    secondary: {
      dark: '#3868c8',
      light: '#a8c5ff',
      main: '#7295fc',
    },
    flagMakerPrint: {
      main: '#ea433e',
    },
  },
  typography: {
    fontFamily:
      'var(--font-roboto), Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100%',
        },
      },
    },
  },
});

export default theme;
