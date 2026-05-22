'use client';

import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../../app/theme';

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export default function CustomThemeProvider({
  children,
}: CustomThemeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
