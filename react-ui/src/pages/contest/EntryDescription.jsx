import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { HtmlWrapper, RedditMarkdown } from '../../components';

const useStyles = makeStyles((theme) => ({
  expand: {
    marginLeft: 'auto',
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  overlay: {
    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 48px)',
  },
}));

function EntryDescription({ description, markdown }) {
  const [expanded, setExpanded] = useState(false);
  const handleExpandClick = () => setExpanded(!expanded);

  const classes = useStyles();
  return (
    <Box display="flex" alignItems="flex-start">
      <Collapse collapsedSize={48} in={expanded} timeout="auto">
        <Typography
          className={clsx({ [classes.overlay]: !expanded })}
          component="div"
          variant="caption"
        >
          {markdown ? <RedditMarkdown text={description} /> : <HtmlWrapper html={description} />}
        </Typography>
      </Collapse>
      <IconButton
        className={clsx(classes.expand, {
          [classes.expandOpen]: expanded,
        })}
        onClick={handleExpandClick}
        aria-expanded={expanded}
        aria-label="Show descrption"
      >
        <ExpandMoreIcon />
      </IconButton>
    </Box>
  );
}

EntryDescription.propTypes = {
  description: PropTypes.string.isRequired,
  markdown: PropTypes.bool,
};

EntryDescription.defaultProps = {
  markdown: false,
};

export default EntryDescription;
