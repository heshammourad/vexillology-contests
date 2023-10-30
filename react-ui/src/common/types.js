/**
 * @file Custom or reusable prop types to extend the prop-types package.
 */
import {
  bool, node, number, oneOf, oneOfType, shape, string,
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
  submission: shape({
    backgroundColor: oneOf(['#000000', '#FFFFFF', '#4b91e3']),
    category: string,
    description: string,
    id: string,
    imagePath: string,
    modifiedBy: string,
    name: string,
    rejectionReason: string,
    submissionStatus: oneOf(['approved', 'pending', 'rejected', 'withdrawn']),
    submissionTime: string,
    user: string,
  }),
  to: oneOfType([
    shape({
      pathname: string,
      state: shape({}),
    }),
    string,
  ]),
  userBreakdown: shape({
    approved: number,
    submitted: number,
  }),
};

export default types;
