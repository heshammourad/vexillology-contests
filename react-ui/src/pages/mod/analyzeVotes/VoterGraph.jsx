import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';

import useContestId from '../../../data/useContestId';
import useSwrAuth from '../../../data/useSwrAuth';

import { useContestContext } from './ContestContext';
import { roundTwoDecimals, createTraces } from './functions';

const MARKER_TYPES = { other: 0, targetedEntry: 1 };
const LARGE = 8;
const SMALL = 4;
// size, color, symbol, opacity
const MARKERS = {
  entry: {
    targetedEntry: { size: LARGE, color: 'red', symbol: 'square' },
    other: { size: LARGE, color: 'green', symbol: 'square' },
  },
  voter: {
    targetedEntry: { size: LARGE, color: 'red' },
    other: { size: SMALL, color: 'gray' },
  },
};

function VoterGraph({ voterId, entrantId }) {
  const contestId = useContestId();

  const {
    data: voterVotes,
    error,
    isLoading,
  } = useSwrAuth(
    contestId && voterId
      ? `/voter-votes?contestId=${contestId}&voterId=${voterId}`
      : null,
  );
  const {
    entryAverages,
    voterPatternsError: averagesError,
    voterPatternsLoading: averagesLoading,
    entrantsData,
    entrantsError,
    entrantsLoading,
  } = useContestContext();

  if (isLoading || averagesLoading || (entrantId && entrantsLoading)) {
    return <div>Loading voter data...</div>;
  }

  if (error || averagesError || (entrantId && entrantsError)) {
    return (
      <div>
        Error loading voter data:
        {error.message}
      </div>
    );
  }

  const sortedAverages = entryAverages.sort((a, b) => a.average - b.average);
  const targetEntries = entrantId
    ? entrantsData[entrantId].map((entrant) => entrant.entryId)
    : [];

  /**
   * CREATE DATA POINTS FOR TRACES
   */
  const userPoints = [];
  const entryPoints = [];

  sortedAverages.forEach(({ average, entryId }, i) => {
    const group = targetEntries.includes(entryId)
      ? MARKER_TYPES.targetedEntry
      : MARKER_TYPES.other;
    const voterScore = voterVotes[entryId] ?? undefined;
    const text = `Entry ${entryId}<br />Voter: ${
      voterScore ?? 'N/A'
    }<br />Average: ${roundTwoDecimals(average)}`;
    userPoints.push({
      x: i,
      y: voterScore,
      group,
      text,
    });
    entryPoints.push({
      x: i,
      y: average,
      group,
      text,
    });
  });

  /**
   * CONVERT DATA POINTS TO TRACES
   */
  const userTraces = createTraces(userPoints, [
    { name: 'Voter (other)', marker: MARKERS.voter.other },
    { name: 'Voter (target)', marker: MARKERS.voter.targetedEntry },
  ]);

  const entryTraces = createTraces(entryPoints, [
    { name: 'Average (other)', marker: MARKERS.entry.other },
    { name: 'Average (target)', marker: MARKERS.entry.targetedEntry },
  ]);

  const data = [...userTraces, ...entryTraces];

  const layout = {
    title: `${voterId}'s votes compared to average`,
    xaxis: { title: 'Flag' },
    yaxis: { title: 'Score', range: [-0.5, 5.5] },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      showLegend
      style={{ width: '80%', height: '500px', maxHeight: '500px' }}
    />
  );
}

VoterGraph.propTypes = {
  voterId: PropTypes.string.isRequired,
  entrantId: PropTypes.string,
};

VoterGraph.defaultProps = {
  entrantId: undefined,
};

export default VoterGraph;
