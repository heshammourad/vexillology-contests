import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

const MAX_RATIO = 4 / 3;

function LazyLoadCardImage({
  displayWidth, height, width, image,
}) {
  const actualWidth = Math.min(displayWidth, width);
  const maxHeight = Math.min(actualWidth / MAX_RATIO, Math.ceil((height * actualWidth) / width));
  return (
    <div style={{ maxHeight }}>
      <LazyLoad height={maxHeight} offset={1080} resize>
        <CardMedia
          component="img"
          image={image}
          style={{
            height: '100%',
            maxHeight,
            maxWidth: displayWidth,
            width: '100%',
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
