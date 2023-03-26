import {
  bool, node, oneOf, oneOfType, shape, string,
} from 'prop-types';

const color = oneOf(['default', 'inherit', 'primary', 'secondary', 'transparent']);

export const objects = {
  AppBar: {
    accountMenuColor: color,
    children: node,
    className: string,
    color,
    isElevationScroll: bool,
    position: oneOf(['absolute', 'fixed', 'relative', 'static', 'sticky']),
    right: node,
  },
};

export const defaultProps = {
  AppBar: {
    accountMenuColor: 'default',
    children: null,
    className: undefined,
    color: 'primary',
    isElevationScroll: false,
    position: 'fixed',
    right: null,
  },
};

const types = {
  AppBar: shape({ ...objects.AppBar }),
  color,
  to: oneOfType([
    shape({
      pathname: string,
      state: shape({}),
    }),
    string,
  ]),
};

export default types;
