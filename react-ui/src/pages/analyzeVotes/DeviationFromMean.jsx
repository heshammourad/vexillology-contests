/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function DeviationFromMean({
  username, votes, userAvg, entryAvg, setUsername,
}) {
  const usernamesByAvg = useMemo(() => userAvg.sort((a, b) => a.average - b.average).map((ua) => ua.username), [userAvg]);

  const xAxis = useMemo(() => userAvg.map((ua) => ua.average), [userAvg]);

  const colors = useMemo(() => userAvg.map((ua) => (ua.username === username ? 'red' : 'black')), [username, userAvg]);
  const sizes = useMemo(() => userAvg.map((ua) => (ua.username === username ? 12 : 6)), [username, userAvg]);

  const yAxis = useMemo(() => {
    // STANDARD DEVIATION
    const entryRatings = {};
    const entryAverageLookup = entryAvg.reduce((acc, curr) => ({ ...acc, [curr.entryId]: curr.average }), {});

    votes.forEach((v) => {
      if (!entryRatings[v.entryId]) {
        entryRatings[v.entryId] = [];
      }
      entryRatings[v.entryId].push(v.rating);
    });

    const entryDeviationLookup = Object.keys(entryRatings).reduce((acc, entryId) => {
      const differences = entryRatings[entryId].map((rating) => (rating - entryAverageLookup[entryId]) ** 2);
      const sd = Math.sqrt(differences.reduce((a, b) => a + b, 0) / differences.length);
      return { ...acc, [entryId]: sd };
    }, {});

    const userZScores = {};
    votes.forEach((v) => {
      if (!userZScores[v.username]) {
        userZScores[v.username] = [];
      }
      userZScores[v.username].push((v.rating - entryAverageLookup[v.entryId]) / entryDeviationLookup[v.entryId]);
    });

    return userAvg.map((ua) => userZScores[ua.username].reduce((a, b) => a + b, 0) / userZScores[ua.username].length);
  }, [votes, userAvg, entryAvg]);

  const handleKeyUp = useCallback(({ key }) => {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      setUsername((prev) => {
        const index = usernamesByAvg.indexOf(prev);
        if (key === 'ArrowLeft') {
          return usernamesByAvg[index - 1] || usernamesByAvg[usernamesByAvg.length - 1];
        }
        return usernamesByAvg[index + 1] || usernamesByAvg[0];
      });
    }
  }, [usernamesByAvg]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp]);

  const trace1 = {
    x: xAxis,
    y: yAxis,
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: sizes,
      color: colors,
    },
    text: usernamesByAvg,
    hovertemplate: 'User: %{text}<br />Avg: %{x:.2f}<br />Z-score:%{y:.2f}',
  };

  const data = [trace1];

  const layout = {
    title: 'Overly negative and positive users',
    xaxis: { title: 'User average' },
    yaxis: { title: 'Negativity / positivity (z̄ score)' },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUsername(usernamesByAvg[e.points[0].pointIndex])}
    />
  );
}

export default DeviationFromMean;

DeviationFromMean.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  userAvg: PropTypes.arrayOf(object).isRequired,
  username: PropTypes.string,
  votes: PropTypes.arrayOf(object).isRequired,
  setUsername: PropTypes.func.isRequired,
};

DeviationFromMean.defaultProps = {
  username: '',
};
