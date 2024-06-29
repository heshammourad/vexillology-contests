/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

const MAX_LEGEND_CHARS = 6;

/**
 * Compare suer activity across each flag
 */
function CompareVotes({
  username, votes, entryAvg, entryUserLookup, username2,
}) {
  // Just number the X axis
  const xAxis = Array.from({ length: entryAvg.length }, (_, index) => index + 1);

  // Sort user votes from 0 > 5
  const userVotes = useMemo(() => votes.filter((v) => v.username === username).sort((a, b) => a.rating - b.rating), [votes, username]);
  // Isolate ratings from user votes into separate array
  const userData = useMemo(() => userVotes.map((v) => v.rating), [userVotes]);

  // Sort user votes from 0 > 5
  const user2Votes = useMemo(() => votes.filter((v) => v.username === username2).sort((a, b) => a.rating - b.rating), [votes, username2]);
  // Isolate ratings from user votes into separate array
  const user2Data = useMemo(() => user2Votes.map((v) => v.rating), [user2Votes]);

  // Sort entry averages to match userData
  const entryData = useMemo(() => {
    const entryLookup = userVotes.reduce((acc, curr, i) => ({ ...acc, [curr.entryId]: i }), {});
    const array = new Array(entryAvg.length);
    let unvotedIndex = userVotes.length;

    entryAvg.forEach((e) => {
      const index = entryLookup[e.entryId];
      if (typeof index === 'number') {
        array[index] = e.average;
      } else {
        array[unvotedIndex] = e.average;
        unvotedIndex += 1;
      }
    });

    return array;
  }, [userVotes, entryAvg]);

  const text = useMemo(() => entryData.map((e, i) => {
    const rounded = Math.round(e * 100) / 100;
    return `Flag average: ${rounded}<br />User Score: ${userData[i] || 'None'}<br />User 2 Score: ${user2Data[i] || 'None'}`;
  }), [userData, user2Data, entryData]);

  const userColors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 'red' : 'green')), [username, entryUserLookup]);
  const userSizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 11 : 8)), [username, entryUserLookup]);

  const user2Colors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username2 ? 'red' : 'blue')), [username2, entryUserLookup]);
  const user2Sizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username2 ? 11 : 8)), [username2, entryUserLookup]);

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

export default CompareVotes;

CompareVotes.propTypes = {
  entryAvg: PropTypes.arrayOf(object).isRequired,
  entryUserLookup: PropTypes.arrayOf(object).isRequired,
  username: PropTypes.string.isRequired,
  username2: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(object).isRequired,
};
