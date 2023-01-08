import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

function CountdownTimer({ end }) {
  const [timer, setTimer] = useState();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(formatDistanceStrict(new Date(), end));
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [end]);

  return <span>{timer}</span>;
}

CountdownTimer.propTypes = {
  end: PropTypes.instanceOf(Date).isRequired,
};

export default CountdownTimer;
