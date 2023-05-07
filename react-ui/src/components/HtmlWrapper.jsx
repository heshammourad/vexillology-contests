/* eslint-disable react/no-danger */
import { makeStyles } from '@material-ui/core/styles';
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

function HtmlWrapper({ html }) {
  const classes = useStyles();

  const content = parser.parseFromString(html, 'text/html');
  const anchors = Array.from(content.getElementsByTagName('a'));
  anchors.forEach((a) => {
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', 'vexillology-contests');
  });
  return (
    <div
      className={classes.description}
      dangerouslySetInnerHTML={{ __html: content.body.innerHTML }}
    />
  );
}

HtmlWrapper.propTypes = {
  html: PropTypes.string,
};

HtmlWrapper.defaultProps = {
  html: '',
};

export default HtmlWrapper;
