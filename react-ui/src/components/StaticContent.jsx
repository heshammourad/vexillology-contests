import PropTypes from 'prop-types';

import useSwrContest from '../data/useSwrStaticContent';

import HtmlWrapper from './HtmlWrapper';
import RedditMarkdown from './RedditMarkdown';

/**
 * Renders static content from Firebase.
 * @param props
 * @param {string} [props.className] - Additional classes to apply.
 * @param {string} props.id - DB ID of static content.
 */
function StaticContent({ className, id }) {
  const { data } = useSwrContest(id);
  if (!data) {
    return null;
  }

  const { content, markdown } = data;

  return markdown ? (
    <RedditMarkdown {...{ className, text: content }} />
  ) : (
    <HtmlWrapper {...{ className, html: content }} />
  );
}

StaticContent.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
};

StaticContent.defaultProps = {
  className: undefined,
};

export default StaticContent;
