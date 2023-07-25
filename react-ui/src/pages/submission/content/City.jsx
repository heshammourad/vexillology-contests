import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import makeStyles from '@mui/styles/makeStyles';
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
        <IconButton onClick={handleClick} size="large">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
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
