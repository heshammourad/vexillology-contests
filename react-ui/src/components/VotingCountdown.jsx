import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import RefreshIcon from '@material-ui/icons/Refresh';
import ScheduleIcon from '@material-ui/icons/Schedule';
import clsx from 'clsx';
import differenceInDays from 'date-fns/differenceInDays';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import formatDuration from 'date-fns/formatDuration';
import intervalToDuration from 'date-fns/intervalToDuration';
import isFuture from 'date-fns/isFuture';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

const DELIMITER = ', ';
const VOTING_DAYS = 8;

const useStyles = makeStyles((theme) => ({
  icon: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  voteCountdown: {
    alignItems: 'center',
    columnGap: 12,
    display: 'inline-flex',
  },
  voteCountdownLabel: {
    lineHeight: '24px',
  },
  voteCountdownWarning: {
    color: theme.palette.error.main,
  },
}));

function VotingCountdown({
  fontSize, handleExpiry, handleReload, voteEndDate,
}) {
  const [initialized, setInitialized] = useState(false);
  const [textFontSize, setFontSize] = useState();
  const [timeLeft, setTimeLeft] = useState();

  const classes = useStyles();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  let labelVariant = 'body2';
  if (fontSize === 'small' || !isSmUp) {
    labelVariant = 'caption';
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFuture(voteEndDate)) {
        setFontSize();
        setTimeLeft();
        handleExpiry();
        clearInterval(interval);
        return;
      }

      const start = new Date();

      if (fontSize !== 'small') {
        const daysLeft = differenceInDays(voteEndDate, start);
        setFontSize(0.875 + (Math.max(VOTING_DAYS - daysLeft, 0) / VOTING_DAYS) * 0.25);
      }

      const newTimeLeft = isSmUp
        ? formatDuration(intervalToDuration({ start, end: voteEndDate }), {
          format: ['days', 'hours', 'minutes', 'seconds'],
          zero: true,
          delimiter: DELIMITER,
        })
          .split(DELIMITER)
          .reduce((acc, cur) => {
            if (cur.startsWith('0')) {
              return acc;
            }
            acc.push(cur);
            return acc;
          }, [])
          .join(DELIMITER)
        : formatDistanceStrict(start, voteEndDate);
      setTimeLeft(newTimeLeft);
      setInitialized(true);
    }, 500);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [voteEndDate]);

  if (!initialized) {
    return null;
  }

  return (
    <div
      className={clsx(classes.voteCountdown, {
        [classes.voteCountdownWarning]: timeLeft && !differenceInDays(voteEndDate, new Date()),
      })}
    >
      <ScheduleIcon className={classes.icon} fontSize={fontSize} />
      <Typography
        className={classes.voteCountdownLabel}
        style={isSmUp && timeLeft && textFontSize ? { fontSize: `${textFontSize}rem` } : null}
        variant={labelVariant}
      >
        {timeLeft ? (
          <>
            <span>{timeLeft}</span>
            {' '}
            left to vote!
          </>
        ) : (
          <>Voting has ended</>
        )}
      </Typography>
      {!timeLeft
        && (isSmUp ? (
          <Button color="primary" onClick={handleReload}>
            Load Results
          </Button>
        ) : (
          <IconButton onClick={handleReload}>
            <RefreshIcon />
          </IconButton>
        ))}
    </div>
  );
}

VotingCountdown.propTypes = {
  fontSize: PropTypes.oneOf(['medium', 'small']),
  handleExpiry: PropTypes.func.isRequired,
  handleReload: PropTypes.func.isRequired,
  voteEndDate: PropTypes.instanceOf(Date).isRequired,
};

VotingCountdown.defaultProps = {
  fontSize: 'medium',
};

export default VotingCountdown;
