/* eslint-disable max-len */
/* eslint-disable react/forbid-prop-types */
import PropTypes, { object } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function CompareAverages({
  username, votes, entryAvg, entryUserLookup,
}) {
  // Just number the X axis
  const xAxis = Array.from({ length: entryAvg.length }, (_, index) => index + 1);

  // Sort user votes from 0 > 5
  const userVotes = useMemo(() => votes.filter((v) => v.username === username).sort((a, b) => a.rating - b.rating), [votes, username]);
  // Isolate ratings from user votes into separate array
  const userData = useMemo(() => userVotes.map((v) => v.rating), [userVotes]);

  // Sort entry averages to match userData
  const entryData = useMemo(() => {
    const entryLookup = userVotes.reduce((acc, curr, i) => ({ ...acc, [curr.entryId]: i }), {});
    const array = new Array(Object.keys(entryAvg).length);
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
    name: `User vote (${userVotes.length})`,
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
    title: 'User to Average',
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
  entryUserLookup: PropTypes.arrayOf(object).isRequired,
  username: PropTypes.string,
  votes: PropTypes.arrayOf(object).isRequired,
};

CompareAverages.defaultProps = {
  username: '',
};
