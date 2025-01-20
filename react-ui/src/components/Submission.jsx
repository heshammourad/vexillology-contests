import PropTypes from 'prop-types';

import types from '../common/types';

function Submission({
  additionalStyle,
  backgroundColor,
  className,
  imagePath,
  name,
}) {
  return (
    <img
      className={className}
      alt={name}
      src={imagePath}
      style={{
        border: `2px solid ${backgroundColor}`,
        backgroundColor,
        ...additionalStyle,
      }}
    />
  );
}

Submission.propTypes = {
  additionalStyle: PropTypes.shape({}),
  backgroundColor: types.backgroundColor,
  className: PropTypes.string,
  imagePath: PropTypes.string.isRequired,
  name: PropTypes.string,
};

Submission.defaultProps = {
  additionalStyle: {},
  backgroundColor: '#000000',
  className: '',
  name: '',
};

export default Submission;
