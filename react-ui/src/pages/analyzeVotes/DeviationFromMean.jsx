/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

import { roundTwoDecimals, createTraces, trimUsername } from './functions';
import MARKERS from './markers';

const GROUP = { selected: 0, none: 1, few: 2 };

/**
 * Determine how unlike the average each user voted
 */
function DeviationFromMean({
  user1,
  votes,
  userAvg,
  entryAvg,
  setUser1,
  voteMinimum,
}) {
  /**
   * CALCULATE Z SCORE FOR EACH USER
   * How many standard deviations (sd) away from the mean did this user vote?
   * (value - mean) / sd
   */
  const zScoresByUser = useMemo(() => {
    const allVotesByEntry = votes.reduce((acc, vote) => {
      if (!acc[vote.entryId]) {
        acc[vote.entryId] = [];
      }
      acc[vote.entryId].push(vote.rating);
      return acc;
    }, {});

    const averagesByEntryLookup = entryAvg.reduce(
      (acc, curr) => ({ ...acc, [curr.entryId]: curr.average }),
      {},
    );
    // Standard deviation calcution
    const deviationByEntryLookup = Object.keys(allVotesByEntry).reduce(
      (acc, entryId) => {
        const differences = allVotesByEntry[entryId].map(
          (rating) => (rating - averagesByEntryLookup[entryId]) ** 2,
        );
        const sd = Math.sqrt(
          differences.reduce((a, b) => a + b, 0) / differences.length,
        );
        return { ...acc, [entryId]: sd };
      },
      {},
    );

    return votes.reduce((acc, vote) => {
      if (!acc[vote.username]) {
        acc[vote.username] = [];
      }
      acc[vote.username].push(
        (vote.rating - averagesByEntryLookup[vote.entryId])
          / deviationByEntryLookup[vote.entryId],
      );
      return acc;
    }, {});
  }, [votes, userAvg, entryAvg]);

  /**
   * CREATE DATA POINTS FOR EACH USER
   * Using the average of all zScores
   */
  const dataPoints = userAvg.map((ua) => {
    let group = GROUP.none;
    if (ua.username === user1) {
      group = GROUP.selected;
    } else if (zScoresByUser[ua.username].length < voteMinimum) {
      group = GROUP.few;
    }

    const zScore = zScoresByUser[ua.username].reduce((a, b) => a + b, 0)
      / zScoresByUser[ua.username].length;
    return {
      x: ua.average,
      y: zScore,
      id: ua.username,
      group,
      text: `User: ${trimUsername(
        ua.username,
        20,
      )}<br />Avg: ${roundTwoDecimals(
        ua.average,
      )}<br />Z-score: ${roundTwoDecimals(zScore)}`,
    };
  });

  /**
   * CONVERT DATA POINTS TO TRACES
   */
  const data = createTraces(dataPoints, [
    { name: trimUsername(user1), marker: MARKERS.general.selected },
    { name: 'Other users', marker: MARKERS.general.unselected },
    { name: `<${voteMinimum} votes`, marker: MARKERS.general.few },
  ]);

  const layout = {
    title: 'How positive are users?',
    xaxis: { title: 'User average' },
    yaxis: { title: 'Negativity / positivity (z̄ score)' },
  };

  /**
   * ALLOW KEYED NAVIGATION OF THIS CHART (left-right arrows)
   */
  const usernamesByAvg = useMemo(
    () => userAvg.sort((a, b) => a.average - b.average).map((ua) => ua.username),
    [userAvg],
  );

  const handleKeyUp = useCallback(
    ({ key }) => {
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        setUser1((prev) => {
          const index = usernamesByAvg.indexOf(prev);
          if (key === 'ArrowLeft') {
            return (
              usernamesByAvg[index - 1]
              || usernamesByAvg[usernamesByAvg.length - 1]
            );
          }
          return usernamesByAvg[index + 1] || usernamesByAvg[0];
        });
      }
    },
    [usernamesByAvg],
  );

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp]);

  return (
    <Plot
      data={data}
      layout={layout}
      onClick={(e) => setUser1(e.points[0].id)}
    />
  );
}

export default DeviationFromMean;

DeviationFromMean.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  userAvg: PropTypes.arrayOf(object).isRequired,
  user1: PropTypes.string,
  votes: PropTypes.arrayOf(object).isRequired,
  setUser1: PropTypes.func.isRequired,
  voteMinimum: PropTypes.number.isRequired,
};

DeviationFromMean.defaultProps = {
  user1: '',
};
