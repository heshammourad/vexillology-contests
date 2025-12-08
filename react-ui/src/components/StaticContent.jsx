import PropTypes from 'prop-types';

import useSwrStaticContent from '../data/useSwrStaticContent';

import FormattedContent from './FormattedContent';

/**
 * Renders static content from Firebase.
 * @param props
 * @param {string} [props.className] - Additional classes to apply.
 * @param {string} props.id - DB ID of static content.
 */
function StaticContent({ className, id }) {
  const { data } = useSwrStaticContent(id);
  if (!data) {
    return null;
  }

  const { content, isMarkdown } = data;

  return <FormattedContent {...{ className, content, isMarkdown }} />;
}

StaticContent.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
};

StaticContent.defaultProps = {
  className: undefined,
};

export default StaticContent;
