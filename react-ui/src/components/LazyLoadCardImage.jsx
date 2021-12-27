import CardMedia from '@material-ui/core/CardMedia';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

const LazyLoadCardImage = ({ height, image }) => (
  <LazyLoad height={height} offset={1080} resize>
    <CardMedia component="img" image={image} />
  </LazyLoad>
);

LazyLoadCardImage.propTypes = {
  height: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
};

export default LazyLoadCardImage;
