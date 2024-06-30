/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useCallback, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

import MARKERS from './markers';
import {
  createScatter, roundTwoDecimals, splitter, trimUsername,
} from './splitter';

/**
 * Compare user activity across each flag
 */
function DeviationFromMean({
  username, votes, userAvg, entryAvg, setUsername,
}) {
  /**
   * HELPER ARRAY(S)
   */
  const usernamesByAvg = useMemo(() => userAvg.sort((a, b) => a.average - b.average).map((ua) => ua.username), [userAvg]);

  /**
   * POSITION OF USER
   */
  const userPosition = useMemo(() => [userAvg.findIndex((ua) => ua.username === username)], [userAvg, username]);

  /**
   * AVERAGE FOR EACH USER, ORDERED BY AVERAGE FOR EACH USER
   */
  const averagesData = useMemo(() => userAvg.map((ua) => ua.average), [userAvg]);
  const [averagesUnselected, averagesSelected] = splitter(averagesData, userPosition);

  /**
   * Z SCORE FOR EACH USER, ORDERED BY AVERAGE FOR EACH USER
   */
  const zScoreData = useMemo(() => {
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
  const [zScoreUnselected, zScoreSelected] = splitter(zScoreData, userPosition);

  const text = useMemo(() => averagesData.map((a, i) => `User: ${trimUsername(usernamesByAvg[i], 20)}<br />Avg: ${roundTwoDecimals(a)}<br />Z-score: ${roundTwoDecimals(zScoreData[i])}`), [averagesData, usernamesByAvg, zScoreData]);
  const [textUnselected, textSelected] = splitter(text, userPosition);

  const traceSelected = createScatter(trimUsername(username, 8), averagesSelected, zScoreSelected, MARKERS.general.selected, textSelected);
  const traceUnselected = createScatter('Other users', averagesUnselected, zScoreUnselected, MARKERS.general.unselected, textUnselected);

  const data = [traceSelected, traceUnselected];

  const layout = {
    title: 'How positive are users?',
    xaxis: { title: 'User average' },
    yaxis: { title: 'Negativity / positivity (z̄ score)' },
  };

  /**
   * NAVIGATION
   */
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
