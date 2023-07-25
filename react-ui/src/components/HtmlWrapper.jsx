/* eslint-disable react/no-danger */
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  description: {
    overflowWrap: 'break-word',
    '& p': {
      marginTop: 0,
    },
  },
});

const parser = new DOMParser();

/**
 * A component that renders HTML content.
 *
 * @param props
 * @param {string} [props.className] - Additional CSS classes to apply to content.
 * @param {string} props.html - HTML content to render.
 */
function HtmlWrapper({ className, html }) {
  const classes = useStyles();

  const content = parser.parseFromString(html, 'text/html');
  const anchors = Array.from(content.getElementsByTagName('a'));
  anchors.forEach((a) => {
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', 'vexillology-contests');
  });
  return (
    <div
      className={clsx(classes.description, className)}
      dangerouslySetInnerHTML={{ __html: content.body.innerHTML }}
    />
  );
}

HtmlWrapper.propTypes = {
  className: PropTypes.string,
  html: PropTypes.string,
};

HtmlWrapper.defaultProps = {
  className: undefined,
};

HtmlWrapper.defaultProps = {
  html: '',
};

export default HtmlWrapper;
