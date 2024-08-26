import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { markdown } from 'snudown-js';

import HtmlWrapper from './HtmlWrapper';

const useStyles = makeStyles((theme) => ({
  markdown: {
    fontSize: '1.0769230769230769em',
    lineHeight: '20px',
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& h1, & h2': {
      fontSize: '1.2857142857142858em',
      lineHeight: '1.3888888888888888em',
      margin: '0.8333333333333334em 0',
    },
    '& h1, & h3, & h5, & strong': {
      fontWeight: 600,
    },
    '& h2, & h4': {
      fontWeight: 500,
    },
    '& h3, & h4': {
      fontSize: '1.1428571428571428em',
      lineHeight: '1.25em',
      margin: '0.625em 0',
    },
    '& h5, & h6': {
      fontSize: '1em',
      lineHeight: '1.4285714285714286em',
      marginBottom: '0.35714285714285715em',
      marginTop: '0.7142857142857143em',
    },
    '& h6': {
      fontWeight: 400,
      textDecoration: 'underline',
    },
    '& p': {
      marginBottom: 5,
      marginTop: 5,
    },
    '& table': {
      border: 'thin solid grey',
      borderCollapse: 'collapse',
    },
    '& td': {
      border: 'thin solid lightgrey',
      padding: '4px 9px',
    },
    '& th': {
      display: 'none',
    },
  },
}));

/**
 * A component that renders Reddit markdown text as HTML.
 *
 * @param props
 * @param {string} [props.className] - Additional classes to apply.
 * @param {string} props.text - The Reddit markdown text to render as HTML.
 */
function RedditMarkdown({ className, text }) {
  const classes = useStyles();

  return (
    <HtmlWrapper
      className={clsx(classes.markdown, className)}
      html={markdown(text)}
    />
  );
}

RedditMarkdown.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string.isRequired,
};

RedditMarkdown.defaultProps = {
  className: undefined,
};

export default RedditMarkdown;
