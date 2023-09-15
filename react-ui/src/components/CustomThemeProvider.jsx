import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import { useGlobalStyles } from '../common';

const theme = createTheme({
  palette: {
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
  },
});

function CustomThemeProvider({ children }) {
  useGlobalStyles();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

CustomThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CustomThemeProvider;
