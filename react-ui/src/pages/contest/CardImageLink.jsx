import CardActionArea from '@material-ui/core/CardActionArea';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { LazyLoadCardImage } from '../../components';

function CardImageLink({
  displayWidth, height, id, image, nextState, onClick, width,
}) {
  const { state = {} } = useLocation();
  return (
    <RouterLink
      onClick={onClick}
      state={{ ...nextState, back: (state || {}).back, isFromContest: true }}
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
  nextState: PropTypes.shape({}),
  onClick: PropTypes.func,
  width: PropTypes.number.isRequired,
};

CardImageLink.defaultProps = {
  nextState: {},
  onClick: () => {},
};

export default CardImageLink;
