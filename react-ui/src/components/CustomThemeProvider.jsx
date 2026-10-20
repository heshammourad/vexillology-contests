import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import {
  createTheme as createV5Theme,
  ThemeProvider as V5ThemeProvider,
} from '@mui/material/styles';
import PropTypes from 'prop-types';

import useGlobalStyles from '../common/useGlobalStyles';

const palette = {
  flagMakerPrint: {
    main: '#ea433e',
  },
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
};

// The UI mixes MUI v4 (@material-ui) and v5 (@mui) components, and each version reads only
// its own theme, so both get the same palette.
const theme = createTheme({ palette });
const v5Theme = createV5Theme({ palette });

function CustomThemeProvider({ children }) {
  useGlobalStyles();
  return (
    <ThemeProvider theme={theme}>
      <V5ThemeProvider theme={v5Theme}>{children}</V5ThemeProvider>
    </ThemeProvider>
  );
}

CustomThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CustomThemeProvider;
