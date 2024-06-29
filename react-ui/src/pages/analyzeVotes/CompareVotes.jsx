/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

const MAX_LEGEND_CHARS = 6;

/**
 * Compare suer activity across each flag
 */
function CompareAverages({
  username, votes, entryAvg, entryUserLookup, entryPositionLookup, username2,
}) {
  // Just number the X axis
  const xAxis = Array.from({ length: entryAvg.length }, (_, index) => index + 1);

  const userData = useMemo(() => {
    const array = new Array(Object.keys(entryPositionLookup).length);
    votes.forEach((vote) => {
      if (vote.username === username) {
        array[entryPositionLookup[vote.entryId]] = vote.rating;
      }
    });

    return array;
  }, [entryPositionLookup, username]);

  const user2Data = useMemo(() => {
    const array = new Array(Object.keys(entryPositionLookup).length);
    votes.forEach((vote) => {
      if (vote.username === username2) {
        array[entryPositionLookup[vote.entryId]] = vote.rating;
      }
    });

    return array;
  }, [entryPositionLookup, username2]);

  // Sort entry averages to match userData
  const entryData = useMemo(() => entryAvg.map((ea) => ea.average), [entryAvg]);

  const text = useMemo(() => entryData.map((e, i) => {
    const rounded = Math.round(e * 100) / 100;
    return `Flag average: ${rounded}<br />User Score: ${userData[i] || 'None'}<br />User 2 Score: ${user2Data[i] || 'None'}`;
  }), [userData, user2Data, entryData]);

  const userColors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 'red' : 'green')), [username, entryUserLookup]);
  const userSizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 11 : 8)), [username, entryUserLookup]);

  const trace1 = {
    x: xAxis,
    y: userData,
    name: `${username.length < MAX_LEGEND_CHARS ? username : username.substring(0, MAX_LEGEND_CHARS)}... votes`,
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: userSizes,
      color: userColors,
    },
    text,
    hovertemplate: '%{text}',
  };

  const user2Colors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username2 ? 'purple' : 'blue')), [username2, entryUserLookup]);
  const user2Sizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username2 ? 11 : 8)), [username2, entryUserLookup]);

  const trace3 = {
    x: xAxis,
    y: user2Data,
    name: `${username2.length < MAX_LEGEND_CHARS ? username2 : username2.substring(0, MAX_LEGEND_CHARS)}... votes`,
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: user2Sizes,
      color: user2Colors,
      symbol: 'diamond',
    },
    text,
    hovertemplate: '%{text}',
  };

  const entryColors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username || entryUserLookup[ea.entryId] === username2 ? 'red' : 'gray')), [username, username2, entryUserLookup]);
  const entrySizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username || entryUserLookup[ea.entryId] === username2 ? 11 : 6)), [username, username2, entryUserLookup]);
  const entrySymbols = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username2 ? 'diamond-open' : 'circle-open')), [username2, entryUserLookup]);

  const trace2 = {
    x: xAxis,
    y: entryData,
    name: 'Flag average',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: entrySizes,
      symbol: entrySymbols,
      line: {
        width: 2,
      },
      color: entryColors,
    },
    text,
    hovertemplate: '%{text}',
  };

  const data = [trace1, trace3, trace2];

  const layout = {
    title: `${username}'s and ${username2}'s votes`,
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
  username2: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
