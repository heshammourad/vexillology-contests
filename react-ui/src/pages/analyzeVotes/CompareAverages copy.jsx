/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function CompareAverages({
  username, votes, entryAvg, entryUserLookup, entryPositionLookup,
}) {


  /**
   * POSITIONS OF USER_SUBMITTED FLAGS
   */
  const [userFlagPositions, userFlagEntryIds] = useMemo(() => {
    const flags = [];
    const entryIds = []
    entryAvg.forEach((ea) => {
      if (entryUserLookup[ea.entryId] === username) {
        // Note sure why this needs to be plus one...
        flags.push(entryPositionLookup[ea.entryId]);
        entryIds.push(ea.entryId);
      }
    });
    return [flags, entryIds];
  }, [username, entryAvg]);
  
  /**
   * EXTRACT USER RATINGS IN SAME ORDER AS FLAGS
   */
  const [userRatingsUserFlags, userRatingsNotUserFlags] = useMemo(() => {
    const user = new Array(Object.keys(entryPositionLookup).length);
    const notUser = new Array(Object.keys(entryPositionLookup).length);
    votes.forEach((vote) => {
      if (vote.username === username) {
        if (userFlagEntryIds.includes(vote.entryId)) {
          user[entryPositionLookup[vote.entryId]] = vote.rating;
        }
        else {
          notUser[entryPositionLookup[vote.entryId]] = vote.rating;
        }
      }
    });

    return array;
  }, [entryPositionLookup, username, userFlagEntryIds]);

  /**
   * EXTRACT AVERAGE SCORE IN SAME ORDER AS FLAGS
   */
  const entryData = useMemo(() => entryAvg.map((ea) => ea.average), [entryAvg]);


  /**
   * X-AXIS
   */
  const xAxis = Array.from({ length: entryAvg.length }, (_, index) => index + 1);
  const notUserFlagPositions = useMemo(() => xAxis.filter((_, i) => !userFlagPositions.includes(i)), [xAxis, userFlagPositions]);

  /**
   * SPLIT USER RATINGS INTO USER-FLAG and NOT-USER_FLAG
   */

  const [userRatingsUserFlags, userRatingsNotUserFlags] = useMemo(() => {
    if (!userFlagPositions.length) {
      return [[], userData];
    }
    return userData.reduce((acc, curr, index) => {
      if (userFlagPositions.includes(index)) {
        return [[...acc[0], curr], acc[1]];
      }
      return [acc[0], [...acc[1], curr]];
    }, [[], []]);
  }, [userData, userFlagPositions]);

  const traceUserRatingsUserFlags = {
    x: userFlagPositions,
    y: userRatingsUserFlags,
    name: 'User votes',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 11,
      color: 'red',
    },
    // text,
    // hovertemplate: '%{text}',
  };

  const traceUserRatingsNotUserFlags = {
    x: notUserFlagPositions,
    y: userRatingsNotUserFlags,
    name: 'User on self',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 6,
      color: 'green',
    },
    // text,
    // hovertemplate: '%{text}',
  };

  /**
   * SPLIT AVERAGE RATINGS INTO USER-FLAG and NOT-USER_FLAG
   */

  const [averageUserFlags, aerageNotUserFlags] = useMemo(() => {
    if (!userFlagPositions.length) {
      return [[], entryData];
    }
    return entryData.reduce((acc, curr, index) => {
      if (userFlagPositions.includes(index)) {
        return [[...acc[0], curr], acc[1]];
      }
      return [acc[0], [...acc[1], curr]];
    }, [[], []]);
  }, [entryData, userFlagPositions]);

  const traceAverageUserFlags = {
    x: userFlagPositions,
    y: averageUserFlags,
    name: 'Average rating',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 11,
      color: 'red',
      symbol: 'circle-open',
    },
    // text,
    // hovertemplate: '%{text}',
  };

  const traceAverageNotUserFlags = {
    x: notUserFlagPositions,
    y: aerageNotUserFlags,
    name: 'Average on self',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 6,
      color: 'gray',
      symbol: 'circle-open',
    },
    // text,
    // hovertemplate: '%{text}',
  };

  /**
   * CREATE UNDERLYING BAR CHART TO HIGHLIGHT USER FLAGS
   */

  const barUserFlag = {
    x: userFlagPositions,
    y: userFlagPositions.map(() => 5),
    width: 1,
    name: 'User flags',
    type: 'bar',
    marker: { color: 'red', opacity: 0.4 },
  };

  // const text = useMemo(() => entryData.map((e, i) => {
  //   const rounded = Math.round(e * 100) / 100;
  //   if (userData[i]) {
  //     return `Flag average: ${rounded}<br />User Score: ${userData[i]}<br />Delta: ${Math.round((e - userData[i]) * 100) / 100}`;
  //   }
  //   return `Flag average: ${rounded}<br />User Score: None`;
  // }), [userData, entryData]);

  const data = [traceUserRatingsUserFlags, traceAverageUserFlags, traceUserRatingsNotUserFlags, traceAverageNotUserFlags, barUserFlag];

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
