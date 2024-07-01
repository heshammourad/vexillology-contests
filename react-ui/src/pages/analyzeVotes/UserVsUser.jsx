/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import Plot from 'react-plotly.js';

import {
  roundTwoDecimals, createTraces,
} from './functions';
import MARKERS from './markers';

const USER_GROUP = { none: 0, submitted: 1, shared: 2 };
const ENTRY_GROUP = { none: 0, user: 1, user2: 2 };

function UserVsUser({
  username, username2, votes, entryAvg, entryUserLookup, entryPositionLookup,
}) {
  /**
   * CREATE TRACES
   */
  const userPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i, y: undefined, group: USER_GROUP.none,
  }));
  const user2Points = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i, y: undefined, group: USER_GROUP.none,
  }));
  const entryPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i, y: entryAvg[i].average, group: ENTRY_GROUP.none,
  }));
  const userBarPoints = [];
  const user2BarPoints = [];

  /**
   * ADD VOTES TO USER TRACES
   */
  votes.forEach((vote) => {
    if (vote.username === username) {
      userPoints[entryPositionLookup[vote.entryId]].y = vote.rating;
    } else if (vote.username === username2) {
      user2Points[entryPositionLookup[vote.entryId]].y = vote.rating;
    }
  });

  /**
   * MARK USER VOTES WHERE BOTH USERS VOTED ON THE SAME FLAG
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
    if (entryUserLookup[ea.entryId] === username) {
      userPoints[i].group = USER_GROUP.submitted;
      entryPoints[i].group = ENTRY_GROUP.user;
      userBarPoints.push({
        x: i, y: 5, group: 0,
      });
    } else if (entryUserLookup[ea.entryId] === username2) {
      user2Points[i].group = USER_GROUP.submitted;
      entryPoints[i].group = ENTRY_GROUP.user2;
      user2BarPoints.push({
        x: i, y: 5, group: 0,
      });
    }
    const text = `User score: ${userPoints[i].y ?? 'None'}<br />User 2 score: ${user2Points[i].y ?? 'None'}<br />Flag average: ${roundTwoDecimals(ea.average)}`;
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

  const userBarTraces = createTraces(userBarPoints, [{ name: 'User 1 entry', marker: MARKERS.bar.user }], { type: 'bar', width: 1 });
  const user2BarTraces = createTraces(user2BarPoints, [{ name: 'User 2 entry', marker: MARKERS.bar.user2 }], { type: 'bar', width: 1 });

  const data = [...userTraces, ...user2Traces, ...entryTraces, ...userBarTraces, ...user2BarTraces];

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

export default UserVsUser;

UserVsUser.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.object.isRequired,
  entryPositionLookup: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  username2: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
