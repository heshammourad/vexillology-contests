/**
 * Only load image when in viewport
 */

import Box from '@material-ui/core/Box';
import CardMedia from '@material-ui/core/CardMedia';
import { makeStyles } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import PropTypes from 'prop-types';
import { useState } from 'react';
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
  const [isLoaded, setLoaded] = useState(false);
  const classes = useStyles();

  const actualWidth = Math.min(displayWidth, width);
  const maxHeight = Math.min(actualWidth / MAX_RATIO, Math.ceil((height * actualWidth) / width));
  return (
    <Box sx={{ width: displayWidth, maxHeight }}>
      <LazyLoad height={maxHeight} offset={100} resize scroll>
        <CardMedia
          className={classes.cardMedia}
          component="img"
          image={image}
          height={maxHeight}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
        {!isLoaded && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: maxHeight,
            width: actualWidth,
          }}
          >
            <Skeleton variant="rect" height={maxHeight} width={actualWidth} />
          </Box>
        )}
      </LazyLoad>
    </Box>
  );
}

LazyLoadCardImage.propTypes = {
  displayWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

export default LazyLoadCardImage;
