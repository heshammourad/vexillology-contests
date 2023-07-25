/**
 * Display user rating with star symbols
 */

import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';

const STAR_SIZE = 16;

const useStyles = makeStyles((theme) => ({
  border: {
    color: theme.palette.grey[600],
    fontSize: STAR_SIZE,
  },
  container: {
    alignSelf: 'end',
    display: 'flex',
    flexShrink: 0,
  },
  filled: {
    color: theme.palette.primary.main,
    fontSize: STAR_SIZE,
  },
}));

function FiveStar({ rating }) {
  const classes = useStyles();

  const filledIcon = <StarIcon className={classes.filled} fontSize="small" />;
  const borderIcon = <StarBorderIcon className={classes.border} fontSize="small" />;
  return (
    <span className={classes.container}>
      {[...Array(5).keys()].map((i) => (
        <span key={i}>{i < rating ? filledIcon : borderIcon}</span>
      ))}
    </span>
  );
}

FiveStar.propTypes = {
  rating: PropTypes.number.isRequired,
};

export default FiveStar;
