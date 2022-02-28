/* eslint-disable react/no-danger */
import PropTypes from 'prop-types';

const parser = new DOMParser();

const HtmlWrapper = ({ html }) => {
  const content = parser.parseFromString(html, 'text/html');
  const anchors = Array.from(content.getElementsByTagName('a'));
  anchors.forEach((a) => {
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', 'vexillology-contests');
  });
  return <div dangerouslySetInnerHTML={{ __html: content.body.innerHTML }} />;
};

HtmlWrapper.propTypes = {
  html: PropTypes.string,
};

HtmlWrapper.defaultProps = {
  html: '',
};

export default HtmlWrapper;
