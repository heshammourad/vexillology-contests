import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

function LazyLoadCardImage({
  displayWidth, height, width, image,
}) {
  const displayHeight = Math.floor((height * displayWidth) / width);
  return (
    <div style={{ height: displayHeight }}>
      <LazyLoad height={displayHeight} offset={1080} resize>
        <CardMedia component="img" image={image} />
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
