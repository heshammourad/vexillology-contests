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

import countdownTypes from '../common/countdownTypes';

const DELIMITER = ', ';
const VARIANTS = {
  [countdownTypes.SUBMISSION]: {
    defaultDays: 18,
    labels: {
      ended: 'Submission is over',
      inProgress: 'left to submit!',
    },
  },
  [countdownTypes.VOTING]: {
    defaultDays: 8,
    labels: {
      ended: 'Voting has ended',
      inProgress: 'left to vote!',
    },
  },
};

const useStyles = makeStyles((theme) => ({
  countdown: {
    alignItems: 'center',
    columnGap: 12,
    display: 'inline-flex',
  },
  countdownLabel: {
    lineHeight: '24px',
  },
  countdownWarning: {
    color: theme.palette.error.main,
  },
  icon: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
}));

function Countdown({
  endDate, fontSize, handleExpiry, handleReload, startDate, variant,
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

  const variantValues = VARIANTS[variant] ?? VARIANTS[countdownTypes.VOTING];
  const periodDays = startDate ? differenceInDays(endDate, startDate) : variantValues.defaultDays;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFuture(endDate)) {
        setFontSize();
        setTimeLeft();
        handleExpiry();
        clearInterval(interval);
        return;
      }

      const now = new Date();

      if (fontSize !== 'small') {
        const daysLeft = differenceInDays(endDate, now);
        setFontSize(0.875 + (Math.max(periodDays - daysLeft, 0) / periodDays) * 0.25);
      }

      const newTimeLeft = isSmUp
        ? formatDuration(intervalToDuration({ start: now, end: endDate }), {
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
        : formatDistanceStrict(now, endDate);
      setTimeLeft(newTimeLeft);
      setInitialized(true);
    }, 500);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [endDate]);

  if (!initialized) {
    return null;
  }

  return (
    <div
      className={clsx(classes.countdown, {
        [classes.countdownWarning]: timeLeft && !differenceInDays(endDate, new Date()),
      })}
    >
      <ScheduleIcon className={classes.icon} fontSize={fontSize} />
      <Typography
        className={classes.countdownLabel}
        style={isSmUp && timeLeft && textFontSize ? { fontSize: `${textFontSize}rem` } : null}
        variant={labelVariant}
      >
        {timeLeft ? (
          <>
            <span>{timeLeft}</span>
            {` ${variantValues.labels.inProgress}`}
          </>
        ) : (
          variantValues.labels.ended
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

Countdown.propTypes = {
  endDate: PropTypes.instanceOf(Date).isRequired,
  fontSize: PropTypes.oneOf(['medium', 'small']),
  handleExpiry: PropTypes.func.isRequired,
  handleReload: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date),
  variant: PropTypes.oneOf(Object.keys(countdownTypes)),
};

Countdown.defaultProps = {
  fontSize: 'medium',
  startDate: null,
  variant: countdownTypes.VOTING,
};

export default Countdown;
