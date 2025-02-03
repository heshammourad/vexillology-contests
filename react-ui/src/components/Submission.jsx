import PropTypes from 'prop-types';

import types from '../common/types';

/**
 * Submission component renders a contest submission with background color.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.additionalStyles - Additional styles to apply to the image.
 * @param {string} props.backgroundColor - The background color of the image.
 * @param {string} props.className - The CSS class names to apply to the image.
 * @param {string} props.imagePath - The source path of the image.
 * @param {string} props.name - The alt text for the image.
 *
 * @returns {JSX.Element} The rendered image component.
 */
function Submission({
  additionalStyles,
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
        ...additionalStyles,
      }}
    />
  );
}

Submission.propTypes = {
  additionalStyles: PropTypes.shape({}),
  backgroundColor: types.backgroundColor,
  className: PropTypes.string,
  imagePath: PropTypes.string.isRequired,
  name: PropTypes.string,
};

Submission.defaultProps = {
  additionalStyles: {},
  backgroundColor: '#000000',
  className: '',
  name: '',
};

export default Submission;
