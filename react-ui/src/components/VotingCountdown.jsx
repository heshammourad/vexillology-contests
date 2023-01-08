import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ScheduleIcon from '@material-ui/icons/Schedule';
import clsx from 'clsx';
import differenceInDays from 'date-fns/differenceInDays';
import PropTypes from 'prop-types';

import CountdownTimer from './CountdownTimer';

const useStyles = makeStyles((theme) => ({
  voteCountdown: {
    alignItems: 'center',
    display: 'inline-flex',
  },
  voteCountdownLabel: {
    lineHeight: '24px',
    paddingLeft: 12,
  },
  voteCountdownWarning: {
    color: theme.palette.error.main,
  },
}));

function VotingCountdown({ fontSize, voteEndDate }) {
  const classes = useStyles();

  let labelVariant = 'body2';
  if (fontSize === 'small') {
    labelVariant = 'caption';
  }

  return (
    <div
      className={clsx(classes.voteCountdown, {
        [classes.voteCountdownWarning]: !differenceInDays(voteEndDate, new Date()),
      })}
    >
      <ScheduleIcon fontSize={fontSize} />
      <Typography className={classes.voteCountdownLabel} variant={labelVariant}>
        <CountdownTimer end={voteEndDate} />
        {' '}
        left to vote!
      </Typography>
    </div>
  );
}

VotingCountdown.propTypes = {
  fontSize: PropTypes.oneOf(['medium', 'small']),
  voteEndDate: PropTypes.instanceOf(Date).isRequired,
};

VotingCountdown.defaultProps = {
  fontSize: 'medium',
};

export default VotingCountdown;
