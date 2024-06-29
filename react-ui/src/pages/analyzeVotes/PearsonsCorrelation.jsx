/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object, string } from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function PearsonsCorrelation({
  username, username2, votes, entryAvg, setUsername2,
}) {
  const entryPositionLookup = useMemo(() => entryAvg
    .reduce((acc, curr, i) => ({ ...acc, [curr.entryId]: i }), {}), [entryAvg]);

  const votesByUserAllEntries = useMemo(() => {
    const numberOfEntries = Object.keys(entryPositionLookup).length;
    const temp = {};
    votes.forEach((vote) => {
      if (!temp[vote.username]) {
        temp[vote.username] = new Array(numberOfEntries);
      }
      temp[vote.username][entryPositionLookup[vote.entryId]] = vote.rating;
    });
    return temp;
  }, [votes, entryPositionLookup]);

  const pearsons = useMemo(() => {
    if (!username || !votesByUserAllEntries[username]) { return []; }
    const userVotes = votesByUserAllEntries[username];
    return Object.keys(votesByUserAllEntries).filter((u) => u !== username).map((u) => {
      const user2Votes = votesByUserAllEntries[u];
      let sum1 = 0; let sum2 = 0; let sum1Sq = 0; let sum2Sq = 0; let sumProduct = 0;
      let n = 0;
      userVotes.forEach((vote, index) => {
        const vote2 = user2Votes[index];
        if (typeof vote === 'number' && typeof vote2 === 'number') {
          sum1 += vote;
          sum2 += vote2;
          sum1Sq += vote * vote;
          sum2Sq += vote2 * vote2;
          sumProduct += vote * vote2;
          n += 1;
        }
      });
      const num = sumProduct - ((sum1 * sum2) / n);
      const den = Math.sqrt((sum1Sq - ((sum1 * sum1) / n)) * (sum2Sq - ((sum2 * sum2) / n)));

      // Should this be null and filtered?
      if (den === 0) { return { username: u, pearsons: 0 }; }

      return { username: u, pearsons: num / den };
    });
  }, [username, votesByUserAllEntries]);

  const usersByPearsons = useMemo(() => pearsons.sort((a, b) => b.pearsons - a.pearsons).map((o) => o.username), [pearsons]);

  const handleKeyUp = useCallback((event) => {
    const { key } = event;
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      setUsername2((prev) => {
        const index = usersByPearsons.indexOf(prev);
        if (key === 'ArrowUp') {
          return usersByPearsons[index - 1] || usersByPearsons[usersByPearsons.length - 1];
        }
        return usersByPearsons[index + 1] || usersByPearsons[0];
      });
    }
  }, [setUsername2, usersByPearsons]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyUp);
    };
  }, [handleKeyUp]);

  const xAxis = useMemo(() => pearsons.map((_, i) => i), [pearsons]);
  const yAxis = useMemo(() => pearsons.map((p) => p.pearsons), [pearsons]);
  const text = useMemo(() => pearsons.map((p) => p.username), [pearsons]);
  const sizes = useMemo(() => pearsons.map((p) => (p.username === username2 ? 12 : 6)), [pearsons, username2]);
  const colors = useMemo(() => pearsons.map((p) => (p.username === username2 ? 'red' : 'black')), [pearsons, username2]);

  const trace1 = {
    x: xAxis,
    y: yAxis,
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: sizes,
      color: colors,
    },
    text,
    hovertemplate: 'User: %{text}<br />Pearsons: %{y:.2f}',
  };

  const data = [trace1];
  const layout = {
    title: `How similar is ${username} to others?`,
    xaxis: { title: 'User' },
    yaxis: { title: 'Similarity (Pearsons)' },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUsername2(text[e.points[0].pointIndex])}
    />
  );
}

export default PearsonsCorrelation;

PearsonsCorrelation.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  username: PropTypes.string,
  username2: PropTypes.string,
  votes: PropTypes.arrayOf(object).isRequired,
  setUsername2: PropTypes.func.isRequired,
};

PearsonsCorrelation.defaultProps = {
  username: '',
  username2: '',
};
