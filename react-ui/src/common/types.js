import {
  bool, node, oneOf, shape, string,
} from 'prop-types';

export const objects = {
  AppBar: {
    children: node.isRequired,
    className: string,
    color: oneOf(['default', 'inherit', 'primary', 'secondary', 'transparent']),
    isElevationScroll: bool,
    position: oneOf(['absolute', 'fixed', 'relative', 'static', 'sticky']),
    right: node,
  },
};

export const defaultProps = {
  AppBar: {
    className: undefined,
    color: 'primary',
    isElevationScroll: false,
    position: 'fixed',
    right: null,
  },
};

const types = {
  AppBar: shape({ ...objects.AppBar }),
};

export default types;
