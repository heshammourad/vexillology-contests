/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

import MARKERS from './markers';
import { createScatter, splitter } from './splitter';

/**
 * Compare user activity across each flag
 */
function CompareAverages({
  username, votes, entryAvg, entryUserLookup, entryPositionLookup,
}) {
  const xAxis = Array.from({ length: entryAvg.length }, (_, index) => index + 1);

  /**
   * POSITIONS OF USER_SUBMITTED FLAGS
   */
  const userFlagPositions = useMemo(() => {
    const flags = [];
    entryAvg.forEach((ea) => {
      if (entryUserLookup[ea.entryId] === username) {
        // Note sure why this needs to be plus one...
        flags.push(entryPositionLookup[ea.entryId]);
      }
    });
    return flags;
  }, [username, entryAvg]);

  const [xAxisUnselected, xAxisSelected] = splitter(xAxis, userFlagPositions);

  /**
   * EXTRACT USER RATINGS IN SAME ORDER AS FLAGS
   */
  const userData = useMemo(() => {
    const array = new Array(Object.keys(entryPositionLookup).length);
    votes.forEach((vote) => {
      if (vote.username === username) {
        array[entryPositionLookup[vote.entryId]] = vote.rating;
      }
    });

    return array;
  }, [entryPositionLookup, username]);

  const [userUnselected, userSelected] = splitter(userData, userFlagPositions);

  /**
   * EXTRACT AVERAGE SCORE IN SAME ORDER AS FLAGS
   */
  const entryData = useMemo(() => entryAvg.map((ea) => ea.average), [entryAvg]);

  const [entryUnselected, entrySelected] = splitter(entryData, userFlagPositions);

  const text = useMemo(() => entryData.map((e, i) => {
    const rounded = Math.round(e * 100) / 100;
    if (typeof userData[i] === 'number') {
      return `Flag average: ${rounded}<br />User Score: ${userData[i]}<br />Delta: ${Math.round((userData[i] - e) * 100) / 100}`;
    }
    return `Flag average: ${rounded}<br />User Score: None`;
  }), [userData, entryData]);

  const [textUnselected, textSelected] = splitter(text, userFlagPositions);

  const traceUserSelected = createScatter('User score (self)', xAxisSelected, userSelected, MARKERS.user1.selected, textSelected);
  const traceUserUnselected = createScatter('User score', xAxisUnselected, userUnselected, MARKERS.user1.unselected, textUnselected);
  const traceEntrySelected = createScatter('Average rating (self)', xAxisSelected, entrySelected, MARKERS.average.selected, textSelected);
  const traceEntryUnselected = createScatter('Average rating', xAxisUnselected, entryUnselected, MARKERS.average.unselected, textUnselected);
  const traceBarSelected = createScatter('Self submissions', xAxisSelected, xAxisSelected.map(() => 5), MARKERS.bar, undefined, true);

  const data = [traceUserSelected, traceUserUnselected, traceEntrySelected, traceEntryUnselected, traceBarSelected];

  /**
   * COUNT NUMBER OF RATINGS FROM USER
   */
  const userVotes = useMemo(() => userData.reduce((acc, curr) => (typeof curr === 'number' ? acc + 1 : acc), 0), [userData]);

  const layout = {
    title: `${username}'s votes compared to average (${userVotes}/${entryData.length})`,
    xaxis: { title: 'Flag' },
    yaxis: { title: 'Score', range: [-0.5, 5.5] },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      showLegend
    />
  );
}

export default CompareAverages;

CompareAverages.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.object.isRequired,
  entryPositionLookup: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
