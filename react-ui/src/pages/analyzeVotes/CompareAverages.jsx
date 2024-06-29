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

  const userVotes = useMemo(() => userData.reduce((acc, curr) => (typeof curr === 'number' ? acc + 1 : acc), 0), [userData]);

  // Sort entry averages to match userData
  const entryData = useMemo(() => entryAvg.map((ea) => ea.average), [entryAvg]);

  const text = useMemo(() => entryData.map((e, i) => {
    const rounded = Math.round(e * 100) / 100;
    if (userData[i]) {
      return `Flag average: ${rounded}<br />User Score: ${userData[i]}<br />Delta: ${Math.round((e - userData[i]) * 100) / 100}`;
    }
    return `Flag average: ${rounded}<br />User Score: None`;
  }), [userData, entryData]);

  const userColors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 'red' : 'green')), [username, entryUserLookup]);
  const userSizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 11 : 8)), [username, entryUserLookup]);

  const trace1 = {
    x: xAxis,
    y: userData,
    name: 'User votes',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: userSizes,
      color: userColors,
    },
    text,
    hovertemplate: '%{text}',
  };

  const entryColors = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 'red' : 'gray')), [username, entryUserLookup]);
  const entrySizes = useMemo(() => entryAvg.map((ea) => (entryUserLookup[ea.entryId] === username ? 11 : 6)), [username, entryUserLookup]);

  const trace2 = {
    x: xAxis,
    y: entryData,
    name: 'Flag average',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: entrySizes,
      symbol: 'circle-open',
      line: {
        width: 2,
      },
      color: entryColors,
    },
    text,
    hovertemplate: '%{text}',
  };

  const data = [trace1, trace2];

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
