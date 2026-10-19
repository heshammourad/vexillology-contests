/* eslint-disable react/forbid-prop-types */
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';

function SectionTitleWithButtons({ title, buttons }) {
  return (
    <Stack alignItems="center" direction="row" gap={2}>
      <Typography>
        <b>{title}</b>
      </Typography>
      {buttons.map((button) => (
        <Button
          key={button.text}
          size="small"
          color={button.color || 'primary'}
          variant="outlined"
          style={{ marginLeft: 10 }}
          onClick={button.onClick}
          disabled={!!button.disabled}
        >
          {button.text}
        </Button>
      ))}
    </Stack>
  );
}

export default SectionTitleWithButtons;

SectionTitleWithButtons.propTypes = {
  title: PropTypes.string.isRequired,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.oneOf(['primary', 'secondary']),
      onClick: PropTypes.func,
      text: PropTypes.string,
      disabled: PropTypes.bool,
    }),
  ),
};

SectionTitleWithButtons.defaultProps = {
  buttons: [],
};
