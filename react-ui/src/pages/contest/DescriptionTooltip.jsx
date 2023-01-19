import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import DescriptionIcon from '@material-ui/icons/Description';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import { HtmlWrapper } from '../../components';

const useStyles = makeStyles((theme) => ({
  description: {
    maxWidth: 600,
    padding: 8,
  },
  icon: {
    color: theme.palette.grey[700],
  },
}));

function DescriptionTooltip({ description }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const classes = useStyles();

  const closeTooltip = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const toggleTooltip = () => {
    setOpen(!open);
  };

  return (
    <>
      <IconButton ref={anchorRef} onClick={toggleTooltip} size="small">
        <DescriptionIcon className={classes.icon} fontSize="small" />
      </IconButton>
      <Popper
        anchorEl={anchorRef.current}
        open={open}
        placement="bottom-end"
        role={undefined}
        transition
      >
        {({ TransitionProps }) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Grow {...TransitionProps}>
            <Paper variant="outlined">
              <ClickAwayListener onClickAway={closeTooltip}>
                <div className={classes.description}>
                  <Typography variant="caption">
                    <HtmlWrapper html={description} />
                  </Typography>
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

DescriptionTooltip.propTypes = {
  description: PropTypes.node.isRequired,
};

export default DescriptionTooltip;
