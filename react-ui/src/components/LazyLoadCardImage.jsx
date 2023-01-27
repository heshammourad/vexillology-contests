import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

function LazyLoadCardImage({
  displayWidth, height, width, image,
}) {
  const actualWidth = Math.min(displayWidth, width);
  const displayHeight = Math.floor((height * actualWidth) / width);
  return (
    <div style={{ height: displayHeight }}>
      <LazyLoad height={displayHeight} offset={1080} resize>
        <CardMedia
          component="img"
          image={image}
          style={{
            height: '100%',
            maxHeight: displayHeight,
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
