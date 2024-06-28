/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function DeviationFromMean({
  username, votes, userAvg, entryAvg, setUsername, usernames,
}) {
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

  const trace1 = {
    x: xAxis,
    y: yAxis,
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: sizes,
      color: colors,
    },
    text: usernames,
    hovertemplate: 'User: %{text}<br />Avg: %{x:.2f}<br />Z-score:%{y:.2f}',
  };

  const data = [trace1];

  const layout = {
    title: 'Deviation From Mean',
    xaxis: { title: 'User average' },
    yaxis: { title: 'Average Z-score' },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUsername(usernames[e.points[0].pointIndex])}
    />
  );
}

export default DeviationFromMean;

DeviationFromMean.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  userAvg: PropTypes.arrayOf(object).isRequired,
  username: PropTypes.string,
  usernames: PropTypes.arrayOf(object).isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
  setUsername: PropTypes.func.isRequired,
};

DeviationFromMean.defaultProps = {
  username: '',
};
