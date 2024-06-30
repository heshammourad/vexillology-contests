/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

import MARKERS from './markers';
import {
  createScatter, roundTwoDecimals, splitter, trimUsername,
} from './splitter';

/**
 * Compare user activity across each flag
 */
function CompareVotes({
  username, username2, votes, entryAvg, entryUserLookup, entryPositionLookup,
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
  const user2FlagPositions = useMemo(() => {
    const flags = [];
    entryAvg.forEach((ea) => {
      if (entryUserLookup[ea.entryId] === username2) {
        // Note sure why this needs to be plus one...
        flags.push(entryPositionLookup[ea.entryId]);
      }
    });
    return flags;
  }, [username2, entryAvg]);

  const [xAxisUnselected, xAxisSelected] = splitter(xAxis, userFlagPositions);
  const [xAxis2Unselected, xAxis2Selected] = splitter(xAxis, user2FlagPositions);

  /**
   * EXTRACT USER RATINGS IN SAME ORDER AS FLAGS
   */
  const userData = useMemo(() => {
    const array = (new Array(Object.keys(entryPositionLookup).length));
    votes.forEach((vote) => {
      if (vote.username === username) {
        array[entryPositionLookup[vote.entryId]] = vote.rating;
      }
    });

    return array;
  }, [entryPositionLookup, username]);

  const [userUnselected, userSelected] = splitter(userData, userFlagPositions, true);
  const user2Data = useMemo(() => {
    const array = (new Array(Object.keys(entryPositionLookup).length));
    votes.forEach((vote) => {
      if (vote.username === username2) {
        array[entryPositionLookup[vote.entryId]] = vote.rating;
      }
    });

    return array;
  }, [entryPositionLookup, username2]);

  const [user2Unselected, user2Selected] = splitter(user2Data, user2FlagPositions, true);

  /**
   * EXTRACT AVERAGE SCORE IN SAME ORDER AS FLAGS
   */
  const entryData = useMemo(() => entryAvg.map((ea) => ea.average), [entryAvg]);

  const [entryUnselected] = splitter(entryData, [...userFlagPositions, ...user2FlagPositions]);
  const [discard, entrySelected] = splitter(entryData, userFlagPositions);
  const [discard2, entry2Selected] = splitter(entryData, user2FlagPositions);

  // const text = useMemo(() => entryData.map((e, i) => {
  //   const rounded = Math.round(e * 100) / 100;
  //   return `Flag average: ${rounded}<br />User Score: ${userData[i] || 'None'}<br />User 2 Score: ${user2Data[i] || 'None'}`;
  // }), [userData, user2Data, entryData]);

  const text = useMemo(() => entryData.map((e, i) => {
    if (typeof userData[i] === 'number') {
      return `User score: ${userData[i]}<br />User 2 score: ${user2Data[i]}<br />Flag average: ${roundTwoDecimals(e)}`;
    }
    return `User Score: None<br />Flag average: ${roundTwoDecimals(e)}`;
  }), [userData, user2Data, entryData]);

  const [textUnselected, textSelected] = splitter(text, userFlagPositions);

  const usernameTrim = trimUsername(username);
  const username2Trim = trimUsername(username2);

  const traceUserSelected = createScatter(`${usernameTrim} score (self)`, xAxisSelected, userSelected, MARKERS.user1.selected, textSelected);
  const traceUserUnselected = createScatter(`${usernameTrim} score`, xAxisUnselected, userUnselected, MARKERS.user1.unselected, textUnselected);
  const traceUser2Selected = createScatter(`${username2Trim} score (self)`, xAxis2Selected, user2Selected, MARKERS.user2.selected, textSelected);
  const traceUser2Unselected = createScatter(`${username2Trim} score`, xAxis2Unselected, user2Unselected, MARKERS.user2.unselected, textUnselected);
  const traceEntrySelected = createScatter('Average rating (self)', xAxisSelected, entrySelected, MARKERS.average.selected, textSelected);
  const traceEntry2Selected = createScatter('Average rating (self)', xAxis2Selected, entry2Selected, MARKERS.average.selected2, textSelected);
  const traceEntryUnselected = createScatter('Average rating', xAxisUnselected, entryUnselected, MARKERS.average.unselected, textUnselected);
  const traceBarSelected = createScatter(`${usernameTrim} submission(s)`, xAxisSelected, xAxisSelected.map(() => 5), MARKERS.bar.user, undefined, true);
  const traceBar2Selected = createScatter(`${username2Trim} submission(s)`, xAxis2Selected, xAxis2Selected.map(() => 5), MARKERS.bar.user2, undefined, true);

  const data = [traceUserSelected, traceUserUnselected, traceUser2Selected, traceUser2Unselected, traceEntrySelected, traceEntryUnselected, traceEntry2Selected, traceBarSelected, traceBar2Selected];

  const layout = {
    title: `${username}'s votes to ${username2}'s`,
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

export default CompareVotes;

CompareVotes.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.object.isRequired,
  entryPositionLookup: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
