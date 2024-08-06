/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import Plot from 'react-plotly.js';

import { roundTwoDecimals, createTraces } from './functions';
import MARKERS from './markers';

const USER_GROUP = { none: 0, submitted: 1, shared: 2 };
const ENTRY_GROUP = { none: 0, user1: 1, user2: 2 };

/**
 * Display user votes vs user2 votes across entire contest
 */
function UserVsUser({
  user1,
  user2,
  votes,
  entryAvg,
  entryUserLookup,
  entryPositionLookup,
}) {
  /**
   * CREATE DATA POINTS FOR TRACES
   */
  const userPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i,
    y: undefined,
    group: USER_GROUP.none,
  }));
  const user2Points = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i,
    y: undefined,
    group: USER_GROUP.none,
  }));
  const entryPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i,
    y: entryAvg[i].average,
    group: ENTRY_GROUP.none,
  }));
  const userBarPoints = [];
  const user2BarPoints = [];

  /**
   * ADD RATINGS (y-value) TO USER DATA POINTS
   */
  votes.forEach((vote) => {
    // TEMP FIX. Sometimes throws TypeError (11vfqjf/mar23), even though user2Points and
    // entryPositionLookup are both derived from entryAvg
    if (
      vote.username === user1
      && userPoints[entryPositionLookup[vote.entryId]]
    ) {
      userPoints[entryPositionLookup[vote.entryId]].y = vote.rating;
    } else if (
      vote.username === user2
      && user2Points[entryPositionLookup[vote.entryId]]
    ) {
      user2Points[entryPositionLookup[vote.entryId]].y = vote.rating;
    }
  });

  /**
   * MARK FLAGS WHERE BOTH USERS VOTED
   */
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < userPoints.length; i++) {
    if (userPoints[i].y > -1 && user2Points[i].y > -1) {
      userPoints[i].group = USER_GROUP.shared;
      user2Points[i].group = USER_GROUP.shared;
    }
  }

  /**
   * MARK USER_SUBMITTED ENTRIES
   */
  entryAvg.forEach((ea, i) => {
    if (entryUserLookup[ea.entryId] === user1) {
      userPoints[i].group = USER_GROUP.submitted;
      entryPoints[i].group = ENTRY_GROUP.user1;
      userBarPoints.push({
        x: i,
        y: 5,
        group: 0,
        text: 'User 1 entry',
      });
    } else if (entryUserLookup[ea.entryId] === user2) {
      user2Points[i].group = USER_GROUP.submitted;
      entryPoints[i].group = ENTRY_GROUP.user2;
      user2BarPoints.push({
        x: i,
        y: 5,
        group: 0,
        text: 'User 2 entry',
      });
    }
    const text = `User score: ${userPoints[i].y ?? 'None'}<br />User 2 score: ${
      user2Points[i].y ?? 'None'
    }<br />Flag average: ${roundTwoDecimals(ea.average)}`;
    userPoints[i].text = text;
    user2Points[i].text = text;
    entryPoints[i].text = text;
  });

  const userTraces = createTraces(userPoints, [
    { name: 'User 1 (no User 2)', marker: MARKERS.user.unshared },
    { name: 'User 1 (self)', marker: MARKERS.user.submitted },
    { name: 'User 1 x User 2', marker: MARKERS.user.shared },
  ]);

  const user2Traces = createTraces(user2Points, [
    { name: 'User 2 (no User 1)', marker: MARKERS.user2.unshared },
    { name: 'User 2 (self)', marker: MARKERS.user2.submitted },
    { name: 'User 2 x User 1', marker: MARKERS.user2.shared },
  ]);

  const entryTraces = createTraces(entryPoints, [
    { name: 'Average rating', marker: MARKERS.average.none },
    { name: 'Average on User 1', marker: MARKERS.average.submitted },
    { name: 'Average on User 2', marker: MARKERS.average.submitted2 },
  ]);

  /**
   * CONVERT DATA POINTS TO TRACES
   */
  const userBarTraces = createTraces(
    userBarPoints,
    [{ name: 'User 1 entry', marker: MARKERS.bar.user }],
    { type: 'bar', width: 1 },
  );
  const user2BarTraces = createTraces(
    user2BarPoints,
    [{ name: 'User 2 entry', marker: MARKERS.bar.user2 }],
    { type: 'bar', width: 1 },
  );

  const data = [
    ...userTraces,
    ...user2Traces,
    ...entryTraces,
    ...userBarTraces,
    ...user2BarTraces,
  ];

  const layout = {
    title: `${user1}'s votes to ${user2}'s`,
    xaxis: { title: 'Flag' },
    yaxis: { title: 'Score', range: [-0.5, 5.5] },
  };

  return <Plot data={data} layout={layout} showLegend />;
}

export default UserVsUser;

UserVsUser.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.object.isRequired,
  entryPositionLookup: PropTypes.object.isRequired,
  user1: PropTypes.string.isRequired,
  user2: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
