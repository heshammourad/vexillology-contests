import PropTypes from 'prop-types';

import HtmlWrapper from './HtmlWrapper';
import RedditMarkdown from './RedditMarkdown';

function FormattedContent({ className, content, isMarkdown }) {
  return isMarkdown ? (
    <RedditMarkdown {...{ className, text: content }} />
  ) : (
    <HtmlWrapper {...{ className, html: content }} />
  );
}

FormattedContent.propTypes = {
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
  isMarkdown: PropTypes.bool,
};

FormattedContent.defaultProps = {
  className: '',
  isMarkdown: false,
};

export default FormattedContent;
