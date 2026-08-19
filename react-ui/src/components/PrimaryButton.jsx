import Button from '@mui/material/Button';
import PropTypes from 'prop-types';

// MUI v5 components aren't covered by the app's (v4-only) CustomThemeProvider theme, so
// color="primary" renders MUI's default blue instead of the app's orange. This mirrors
// CustomThemeProvider's primary palette explicitly for any v5 button that needs it.
const PRIMARY_MAIN = '#fc471e';
const PRIMARY_DARK = '#c10000';

function PrimaryButton({ variant, sx, ...rest }) {
  const colorSx = variant === 'contained'
    ? { bgcolor: PRIMARY_MAIN, '&:hover': { bgcolor: PRIMARY_DARK } }
    : {
      color: PRIMARY_MAIN,
      ...(variant === 'outlined' && { borderColor: PRIMARY_MAIN }),
      '&:hover': {
        color: PRIMARY_DARK,
        bgcolor: 'rgba(252, 71, 30, 0.08)',
        ...(variant === 'outlined' && { borderColor: PRIMARY_DARK }),
      },
    };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Button variant={variant} sx={{ ...colorSx, ...sx }} {...rest} />
  );
}

PrimaryButton.propTypes = {
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  // eslint-disable-next-line react/forbid-prop-types
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

PrimaryButton.defaultProps = {
  variant: 'contained',
  sx: {},
};

export default PrimaryButton;
