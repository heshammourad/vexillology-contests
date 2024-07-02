/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import Plot from 'react-plotly.js';

import {
  roundTwoDecimals,
  createTraces,
} from './functions';
import MARKERS from './markers';

const USER_GROUP = { none: 0, submitted: 1 };
const ENTRY_GROUP = { none: 0, user: 1 };

function UserVsAverage({
  username, votes, entryAvg, entryUserLookup, entryPositionLookup,
}) {
  /**
   * CREATE TRACES
   */
  const userPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i, y: undefined, group: USER_GROUP.none,
  }));
  const entryPoints = Array.from({ length: entryAvg.length }, (_, i) => ({
    x: i, y: entryAvg[i].average, group: ENTRY_GROUP.none,
  }));
  const userBarPoints = [];

  /**
   * ADD VOTES TO USER TRACES
   */
  votes.forEach((vote) => {
    if (vote.username === username) {
      userPoints[entryPositionLookup[vote.entryId]].y = vote.rating;
    }
  });

  /**
   * MARK USER_SUBMITTED ENTRIES
   */
  entryAvg.forEach((ea, i) => {
    if (entryUserLookup[ea.entryId] === username) {
      userPoints[i].group = USER_GROUP.submitted;
      entryPoints[i].group = ENTRY_GROUP.user;
      userBarPoints.push({
        x: i, y: 5, group: 0, text: 'User 1 entry',
      });
    }
    const text = `User score: ${userPoints[i].y ?? 'None'}<br />Flag average: ${roundTwoDecimals(ea.average)}`;
    userPoints[i].text = text;
    entryPoints[i].text = text;
  });

  const userTraces = createTraces(userPoints, [
    { name: 'User 1 vote', marker: MARKERS.user.none },
    { name: 'User 1 vote (self)', marker: MARKERS.user.submitted },
  ]);

  const entryTraces = createTraces(entryPoints, [
    { name: 'Average rating', marker: MARKERS.average.none },
    { name: 'Average (User 1 entry)', marker: MARKERS.average.submitted },
  ]);

  const userBarTraces = createTraces(userBarPoints, [{ name: 'User 1 entry', marker: MARKERS.bar.user }], { type: 'bar', width: 1 });

  const data = [...userTraces, ...entryTraces, ...userBarTraces];
  const userVotes = userPoints.reduce((acc, curr) => (curr.y > -1 ? acc + 1 : acc), 0);

  const layout = {
    title: `${username}'s votes compared to average (${userVotes}/${entryAvg.length})`,
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

export default UserVsAverage;

UserVsAverage.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.object.isRequired,
  entryPositionLookup: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
