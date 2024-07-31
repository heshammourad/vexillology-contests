/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

import {
  roundTwoDecimals, createTraces, trimUsername,
} from './functions';
import MARKERS from './markers';

const GROUP = { selected: 0, none: 1, few: 2 };

/**
 * Determine similarity between selected user and all other users
 */
function PearsonsCorrelation({
  user1, user2, votes, entryPositionLookup, setUser2, voteMinimum,
}) {
  /**
   * CALCULATE PEARSONS
   * Do these voting patterns trend in the same direction?
   * covariance(x, y) / (sd_x * sd_y)
   */
  const pearsons = useMemo(() => {
    if (!user1) { return []; }

    const numberOfEntries = Object.keys(entryPositionLookup).length;
    const allVotesByUser = votes.reduce((acc, vote) => {
      if (!acc[vote.username]) {
        acc[vote.username] = new Array(numberOfEntries);
      }
      acc[vote.username][entryPositionLookup[vote.entryId]] = vote.rating;
      return acc;
    }, {});

    const userVotes = allVotesByUser[user1];
    // User did not vote
    if (!userVotes) { return []; }

    const validPearsons = [];

    Object.keys(allVotesByUser).filter((u) => u !== user1).forEach((u) => {
      const otherUser = allVotesByUser[u];
      let sum1 = 0; let sum2 = 0; let sum1Sq = 0; let sum2Sq = 0; let sumProduct = 0;
      let n = 0;
      let numVotes = 0;
      otherUser.forEach((vote, index) => {
        const userVote = userVotes[index];
        if (vote > -1) {
          numVotes += 1;
          if (userVote > -1) {
            sum1 += vote;
            sum2 += userVote;
            sum1Sq += vote * vote;
            sum2Sq += userVote * userVote;
            sumProduct += vote * userVote;
            n += 1;
          }
        }
      });
      const num = sumProduct - ((sum1 * sum2) / n);
      const den = Math.sqrt((sum1Sq - ((sum1 * sum1) / n)) * (sum2Sq - ((sum2 * sum2) / n)));

      if (n !== 0 && den !== 0) {
        validPearsons.push({ username: u, correlation: num / den, group: numVotes < voteMinimum ? GROUP.few : undefined });
      }
    });

    return validPearsons.sort((a, b) => a.correlation - b.correlation);
  }, [user1, votes, entryPositionLookup, voteMinimum]);

  /**
   * CREATE DATA POINTS FOR EACH USER
   */
  const userPoints = pearsons.map((p, i) => ({
    x: i,
    y: p.correlation,
    id: p.username,
    group: p.username === user2 ? GROUP.selected : (p.group || GROUP.none),
    text: `User 2: ${trimUsername(p.username)}<br />Pearsons: ${roundTwoDecimals(p.correlation)}`,
  }));

  /**
   * CONVERT DATA POINTS TO TRACES
   */
  const data = createTraces(userPoints, [
    { name: trimUsername(user2, 20), marker: MARKERS.general.selected },
    { name: 'Other users', marker: MARKERS.general.unselected },
    { name: `<${voteMinimum} votes`, marker: MARKERS.general.few },
  ]);

  const layout = {
    title: `How similar is ${user1} to others?`,
    xaxis: { title: 'User' },
    yaxis: { title: 'Similarity (Pearsons)' },
  };

  /**
   * ALLOW KEYED NAVIGATION OF THIS CHART (up-down arrows)
   */
  const usernames = useMemo(() => pearsons.map((p) => p.username), [pearsons]);
  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      setUser2((prev) => {
        const index = usernames.indexOf(prev);
        if (key === 'ArrowUp') {
          return usernames[index + 1] || usernames[0];
        }
        return usernames[index - 1] || usernames[usernames.length - 1];
      });
    }
  }, [setUser2, usernames]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUser2(e.points[0].id)}
    />
  );
}

export default PearsonsCorrelation;

PearsonsCorrelation.propTypes = {
  entryPositionLookup: PropTypes.object.isRequired,
  user1: PropTypes.string,
  user2: PropTypes.string,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
  setUser2: PropTypes.func.isRequired,
  voteMinimum: PropTypes.number.isRequired,
};

PearsonsCorrelation.defaultProps = {
  user1: '',
  user2: '',
};
