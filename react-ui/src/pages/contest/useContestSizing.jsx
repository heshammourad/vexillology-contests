/**
 * Display size for contest flags
 */

import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import {
  useClientWidth,
  useSettingsState,
} from '../../common';

const imageWidths = {
  default: {
    lg: 400,
    md: 448,
    sm: 552,
  },
  compact: {
    lg: 302,
    md: 299,
    sm: 272,
  },
  full: {
    lg: 1280,
    md: 960,
    sm: 600,
  },
};

function useContestSizing() {
  const [{ density = 'default' }] = useSettingsState();
  // Check screen width
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  // Check browser width
  const clientWidth = useClientWidth();
  // Pad container width
  const defaultContainerWidth = clientWidth - 32;

  // Map media query to string
  let size;
  if (isLgUp) {
    size = 'lg';
  } else if (isMdUp) {
    size = 'md';
  } else if (isSmUp) {
    size = 'sm';
  }

  const gridDisplayWidth = size ? imageWidths[density][size] : defaultContainerWidth;
  const winnerDisplayWidth = size ? imageWidths.full[size] - 48 : defaultContainerWidth;

  const headingVariant = isSmUp ? 'h3' : 'h5';

  return { headingVariant, gridDisplayWidth, winnerDisplayWidth };
}

export default useContestSizing;
