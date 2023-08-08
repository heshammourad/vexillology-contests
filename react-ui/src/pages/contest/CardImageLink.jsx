/**
 * Display entry image with link
 */

import CardActionArea from '@material-ui/core/CardActionArea';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { LazyLoadCardImage } from '../../components';

function CardImageLink({
  displayWidth, height, id, image, width,
}) {
  const location = useLocation();
  return (
    <RouterLink
      state={{ background: location }}
      to={`entry/${id}`}
    >
      <CardActionArea>
        <LazyLoadCardImage
          displayWidth={displayWidth}
          height={height}
          image={image}
          width={width}
        />
      </CardActionArea>
    </RouterLink>
  );
}

CardImageLink.propTypes = {
  displayWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

CardImageLink.defaultProps = {
};

export default CardImageLink;
