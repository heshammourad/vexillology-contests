/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

import MARKERS from './markers';
import {
  createScatter, roundTwoDecimals, splitter, trimUsername,
} from './splitter';

/**
 * Compare user similarity
 */
function PearsonsCorrelation({
  username, username2, votes, entryPositionLookup, setUsername2,
}) {
  /**
   * CALCULATE PEARSONS
   */
  const pearsons = useMemo(() => {
    // ERROR
    if (!username) { return []; }

    // {[username]: rating[]}
    const numberOfEntries = Object.keys(entryPositionLookup).length;
    const votesByUserAllEntries = {};
    votes.forEach((vote) => {
      if (!votesByUserAllEntries[vote.username]) {
        votesByUserAllEntries[vote.username] = new Array(numberOfEntries);
      }
      votesByUserAllEntries[vote.username][entryPositionLookup[vote.entryId]] = vote.rating;
    });

    // ERROR
    if (!votesByUserAllEntries[username]) { return []; }

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
      if (n === 0 || den === 0) { return { username: u, pearsons: undefined }; }

      return { username: u, pearsons: num / den };
    }).filter((p) => p.pearsons !== undefined)
      .sort((a, b) => a.pearsons - b.pearsons);
  }, [username, votes, entryPositionLookup]);

  /**
   * SPLIT INTO AXES
   */
  const xAxis = Array.from({ length: pearsons.length }, (_, index) => index + 1);
  const yAxis = useMemo(() => pearsons.map((p) => p.pearsons), [pearsons]);
  const usernames = useMemo(() => pearsons.map((p) => p.username), [pearsons]);

  /**
   * POSITION OF USER 2
   */
  const user2Position = useMemo(() => [usernames.indexOf(username2)], [usernames, username2]);

  const [pearsonsUnselected, pearsonsSelected] = splitter(yAxis, user2Position);
  const [xAxisUnselected, xAxisSelected] = splitter(xAxis, user2Position);
  // hovertemplate: 'User: %{text}<br />Pearsons: %{y:.2f}',
  const text = useMemo(() => pearsons.map((p) => `User 2: ${trimUsername(p.username, 20)}<br />Pearsons: ${roundTwoDecimals(p.pearsons)}`), [pearsons]);
  const [textUnselected, textSelected] = splitter(text, user2Position);

  const traceSelected = createScatter(trimUsername(username2, 8), xAxisSelected, pearsonsSelected, MARKERS.general.selected, textSelected);
  const traceUnselected = createScatter('Other users', xAxisUnselected, pearsonsUnselected, MARKERS.general.unselected, textUnselected);
  // const text = useMemo(() => pearsons.map((p) => p.username), [pearsons]);
  // const sizes = useMemo(() => pearsons.map((p) => (p.username === username2 ? 12 : 6)), [pearsons, username2]);
  // const colors = useMemo(() => pearsons.map((p) => (p.username === username2 ? 'red' : 'black')), [pearsons, username2]);

  const data = [traceSelected, traceUnselected];
  const layout = {
    title: `How similar is ${username} to others?`,
    xaxis: { title: 'User' },
    yaxis: { title: 'Similarity (Pearsons)' },
  };

  const handleKeyUp = useCallback((event) => {
    const { key } = event;
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      setUsername2((prev) => {
        const index = usernames.indexOf(prev);
        if (key === 'ArrowUp') {
          return usernames[index + 1] || usernames[0];
        }
        return usernames[index - 1] || usernames[usernames.length - 1];
      });
    }
  }, [setUsername2, usernames]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyUp);
    };
  }, [handleKeyUp]);

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUsername2(usernames[e.points[0].pointIndex])}
    />
  );
}

export default PearsonsCorrelation;

PearsonsCorrelation.propTypes = {
  entryPositionLookup: PropTypes.object.isRequired,
  username: PropTypes.string,
  username2: PropTypes.string,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
  setUsername2: PropTypes.func.isRequired,
};

PearsonsCorrelation.defaultProps = {
  username: '',
  username2: '',
};
