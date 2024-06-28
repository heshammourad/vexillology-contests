/* eslint-disable react/forbid-prop-types */
import PropTypes, { object, string } from 'prop-types';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * Compare suer activity across each flag
 */
function CompareAverages({
  username, votes, entryAvg, entryPositionLookup,
}) {
  const array = Array.from({ length: entryAvg.length }, (_, index) => index + 1);

  const userVotes = useMemo(() => {
    if (!username) {
      return [];
    }

    const a = new Array(Object.keys(entryPositionLookup).length);
    votes.forEach((v) => {
      if (v.username === username) {
        const index = entryPositionLookup[v.entryId];
        if (typeof index === 'number') {
          a[index] = v.rating;
        }
      }
    });
    return a;
  }, [username, votes, entryPositionLookup]);

  const entryAverages = useMemo(() => {
    const a = new Array(Object.keys(entryPositionLookup).length);
    entryAvg.forEach((ea) => {
      const index = entryPositionLookup[ea.entryId];
      if (typeof index === 'number') {
        a[index] = ea.average;
      }
    });
    return a;
  }, [entryAvg, entryPositionLookup]);

  const trace1 = {
    x: array,
    y: userVotes,
    name: 'User vote',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 8,
      color: 'green',
    },
  };

  const trace2 = {
    x: array,
    y: entryAverages,
    name: 'Flag average',
    type: 'scatter',
    mode: 'markers',
    marker: {
      size: 6,
      symbol: 'circle-open',
      line: {
        width: 2,
      },
      color: 'gray',
    },
  };

  const data = [trace1, trace2];

  const layout = {
    title: 'Poor sportsmanship - Averages',
    xaxis: { title: 'Flag' },
    yaxis: { title: 'Score' },
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
  entryPositionLookup: PropTypes.arrayOf(string).isRequired,
  username: PropTypes.string,
  votes: PropTypes.arrayOf(object).isRequired,
};

CompareAverages.defaultProps = {
  username: '',
};
