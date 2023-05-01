import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { ExternalLink } from '../../../components';

const useStyles = makeStyles({
  collapse: {
    padding: '0 16px',
  },
  image: {
    width: '100%',
  },
});

function City({
  city: {
    facts, image, link, name,
  },
}) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(!open);
  };

  const classes = useStyles();
  return (
    <>
      <ListItem>
        <ListItemText
          primary={(
            <ExternalLink color="secondary" href={link}>
              {name}
            </ExternalLink>
          )}
        />
        <IconButton onClick={handleClick}>{open ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </ListItem>
      <Collapse className={classes.collapse} in={open} timeout="auto" unmountOnExit>
        <Box display="flex">
          <Box flexBasis="34%" flexShrink={1}>
            <img src={image} alt={`Flag of ${name}`} className={classes.image} />
          </Box>
          <Box flexBasis="66%">
            <ul>
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </Box>
        </Box>
      </Collapse>
    </>
  );
}

City.propTypes = {
  city: PropTypes.shape({
    facts: PropTypes.arrayOf(PropTypes.string),
    image: PropTypes.string,
    link: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};

export default City;
