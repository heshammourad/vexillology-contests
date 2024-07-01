/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

import {
  roundTwoDecimals, createTraces, trimUsername,
} from './functions';
import MARKERS from './markers';

const GROUP = { selected: 0, none: 1 };

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
    // USER DOES NOT EXISTS
    if (!username) { return []; }

    const numberOfEntries = Object.keys(entryPositionLookup).length;
    const allVotesByUser = votes.reduce((acc, vote) => {
      if (!acc[vote.username]) {
        acc[vote.username] = new Array(numberOfEntries);
      }
      acc[vote.username][entryPositionLookup[vote.entryId]] = vote.rating;
      return acc;
    }, {});

    const userVotes = allVotesByUser[username];
    // USER DID NOT VOTE
    if (!userVotes) { return []; }

    return Object.keys(allVotesByUser).filter((u) => u !== username).map((u) => {
      const otherUser = allVotesByUser[u];
      let sum1 = 0; let sum2 = 0; let sum1Sq = 0; let sum2Sq = 0; let sumProduct = 0;
      let n = 0;
      userVotes.forEach((vote, index) => {
        const othersVote = otherUser[index];
        if (vote > -1 && othersVote > -1) {
          sum1 += vote;
          sum2 += othersVote;
          sum1Sq += vote * vote;
          sum2Sq += othersVote * othersVote;
          sumProduct += vote * othersVote;
          n += 1;
        }
      });
      const num = sumProduct - ((sum1 * sum2) / n);
      const den = Math.sqrt((sum1Sq - ((sum1 * sum1) / n)) * (sum2Sq - ((sum2 * sum2) / n)));

      // Should this be null and filtered?
      if (n === 0 || den === 0) { return { username: u, correlation: undefined }; }

      return { username: u, correlation: num / den };
    }).filter((p) => p.correlation !== undefined)
      .sort((a, b) => a.correlation - b.correlation);
  }, [username, votes, entryPositionLookup]);

  const userPoints = pearsons.map((p, i) => ({
    x: i,
    y: p.correlation,
    group: p.username === username2 ? GROUP.selected : GROUP.none,
    text: `User 2: ${trimUsername(p.username)}<br />Pearsons: ${roundTwoDecimals(p.correlation)}`,
  }));

  const data = createTraces(userPoints, [
    { name: trimUsername(username2, 20), marker: MARKERS.general.selected },
    { name: 'Other users', marker: MARKERS.general.unselected },
  ]);

  const layout = {
    title: `How similar is ${username} to others?`,
    xaxis: { title: 'User' },
    yaxis: { title: 'Similarity (Pearsons)' },
  };

  const usernames = useMemo(() => pearsons.map((p) => p.username), [pearsons]);

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
