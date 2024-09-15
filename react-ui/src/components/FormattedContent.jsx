import PropTypes from 'prop-types';

import HtmlWrapper from './HtmlWrapper';
import RedditMarkdown from './RedditMarkdown';

function FormattedContent({ className, content, markdown }) {
  return markdown ? (
    <RedditMarkdown {...{ className, text: content }} />
  ) : (
    <HtmlWrapper {...{ className, html: content }} />
  );
}

FormattedContent.propTypes = {
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
  markdown: PropTypes.bool,
};

FormattedContent.defaultProps = {
  className: '',
  markdown: false,
};

export default FormattedContent;
