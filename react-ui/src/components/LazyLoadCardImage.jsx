import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

function LazyLoadCardImage({
  displayWidth, height, width, image,
}) {
  const displayHeight = Math.floor((height * displayWidth) / width);
  const maxHeight = displayWidth * 0.75;
  const actualHeght = Math.min(displayHeight, maxHeight);
  return (
    <div style={{ height: actualHeght }}>
      <LazyLoad height={actualHeght} offset={1080} resize>
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
