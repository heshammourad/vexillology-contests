import {
  createTheme,
  ThemeProvider,
  StyledEngineProvider,
  adaptV4Theme,
} from '@mui/material/styles';
import PropTypes from 'prop-types';

import { useGlobalStyles } from '../common';

const theme = createTheme(
  adaptV4Theme({
    palette: {
      flagMakerPrint: {
        main: '#ea433e',
      },
      primary: {
        dark: '#c10000',
        light: '#ff7c4c',
        main: '#fc471e',
      },
      secondary: {
        dark: '#3868c8',
        light: '#a8c5ff',
        main: '#7295fc',
      },
    },
  }),
);

function CustomThemeProvider({ children }) {
  useGlobalStyles();
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}

CustomThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CustomThemeProvider;
