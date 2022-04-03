import CardActionArea from '@material-ui/core/CardActionArea';
import PropTypes from 'prop-types';
import { Link as RouterLink, useRouteMatch } from 'react-router-dom';

import { LazyLoadCardImage } from '../../components';

const CardImageLink = ({
  children, displayWidth, height, id, image, onClick, width,
}) => {
  const match = useRouteMatch();
  return (
    <RouterLink
      onClick={onClick}
      to={{ pathname: `${match.url}/entry/${id}`, state: { isFromContest: true } }}
      style={{ textDecoration: 'none' }}
    >
      <CardActionArea>
        <LazyLoadCardImage
          displayWidth={displayWidth}
          height={height}
          image={image}
          width={width}
        />
        {children}
      </CardActionArea>
    </RouterLink>
  );
};

CardImageLink.propTypes = {
  children: PropTypes.node,
  displayWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  width: PropTypes.number.isRequired,
};

CardImageLink.defaultProps = {
  children: null,
  onClick: () => {},
};

export default CardImageLink;
