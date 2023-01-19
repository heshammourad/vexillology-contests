import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
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
  const [textFontSize, setFontSize] = useState();
  const [timeLeft, setTimeLeft] = useState();

  const classes = useStyles();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  let labelVariant = 'body2';
  if (fontSize === 'small') {
    labelVariant = 'caption';
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFuture(voteEndDate)) {
        setTimeLeft();
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
    }, 500);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [voteEndDate]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div
      className={clsx(classes.voteCountdown, {
        [classes.voteCountdownWarning]: !differenceInDays(voteEndDate, new Date()),
      })}
    >
      <ScheduleIcon fontSize={fontSize} />
      <Typography
        className={classes.voteCountdownLabel}
        style={textFontSize ? { fontSize: `${textFontSize}rem` } : null}
        variant={labelVariant}
      >
        <span>{timeLeft}</span>
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
