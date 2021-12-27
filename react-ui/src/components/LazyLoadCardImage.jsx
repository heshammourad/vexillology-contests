import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

const LazyLoadCardImage = ({
  displayWidth, height, width, image,
}) => (
  <LazyLoad height={Math.ceil((height * displayWidth) / width)} offset={1080} resize>
    <CardMedia component="img" image={image} />
  </LazyLoad>
);

LazyLoadCardImage.propTypes = {
  displayWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

export default LazyLoadCardImage;
