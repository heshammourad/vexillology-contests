/**
 * Only load image when in viewport
 */

import CardMedia from '@mui/material/CardMedia';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

const MAX_RATIO = 4 / 3;

const useStyles = makeStyles({
  cardMedia: {
    objectFit: 'contain',
  },
});

function LazyLoadCardImage({
  displayWidth, height, width, image,
}) {
  const classes = useStyles();

  const actualWidth = Math.min(displayWidth, width);
  const maxHeight = Math.min(actualWidth / MAX_RATIO, Math.ceil((height * actualWidth) / width));
  return (
    <div style={{ maxHeight }}>
      <LazyLoad height={maxHeight} offset={100} resize scroll>
        <CardMedia
          className={classes.cardMedia}
          component="img"
          image={image}
          style={{
            maxHeight,
            maxWidth: displayWidth,
          }}
        />
      </LazyLoad>
    </div>
  );
}

LazyLoadCardImage.propTypes = {
  displayWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

export default LazyLoadCardImage;
