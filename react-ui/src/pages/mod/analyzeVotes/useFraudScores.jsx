import { useMemo } from 'react';

const VOTER_FRAUD_WEIGHTS = {
  outOfOrder: 20,
  entrantFavored: 25,
  historical: 55,
};

const useFraudScores = (voterPatternsData, votingMatrixData, entrantsData) => useMemo(() => {
  if (!voterPatternsData || !votingMatrixData || !entrantsData) {
    return {};
  }

  const result = {};

  // Iterate through all entrants
  Object.keys(entrantsData).forEach((entrantId) => {
    result[entrantId] = {};
    let highest = 0; // Track highest score for this entrant

    // Iterate through all voters for this entrant
    Object.keys(voterPatternsData).forEach((username) => {
      const patternData = voterPatternsData[username];
      if (!patternData) {
        return;
      }

      const matrixData = votingMatrixData[entrantId]?.[username];

      // Check if there's voting matrix data for this entrant-voter pair
      if (!matrixData || matrixData.contestAverageRating === null) {
        result[entrantId][username] = null;
        return;
      }

      // Calculate all fraud metrics in one pass

      // outOfOrder: voting order pattern
      let outOfOrderFraud;
      switch (patternData.votingOrder) {
        case 'random':
          outOfOrderFraud = 1;
          break;
        case 'straight':
          outOfOrderFraud = 0.3;
          break;
        case 'start':
          outOfOrderFraud = 0;
          break;
        default:
          outOfOrderFraud = 0.5; // Default for null/undefined
      }

      // entrantFavored: complex logic based on multiple factors
      let entrantFavoredFraud = 0;
      let entrantFavoredText = 'No favoritism detected';

      if (matrixData.contestAverageRating < 4.5) {
        entrantFavoredFraud = 0;
        entrantFavoredText = `Did not vote strongly for entrant (${matrixData.contestAverageRating})`;
      } else if (patternData.averageVoteRating < 2) {
        entrantFavoredFraud = 1;
        entrantFavoredText = `Very low average vote rating (${patternData.averageVoteRating.toFixed(
          1,
        )})`;
      } else if (patternData.randomnessMetric > 1) {
        entrantFavoredFraud = 0.8;
        entrantFavoredText = `High randomness metric (${patternData.randomnessMetric.toFixed(
          2,
        )})`;
      } else if (patternData.averageVoteRating < 3) {
        entrantFavoredFraud = 0.6;
        entrantFavoredText = `Low average vote rating (${patternData.averageVoteRating.toFixed(
          1,
        )})`;
      } else {
        entrantFavoredFraud = 0.2;
        entrantFavoredText = 'Voted strongly for entrant';
      }

      // historical: percentage of high ratings
      const totalVotes = Number(matrixData.highRating)
          + Number(matrixData.midRating)
          + Number(matrixData.lowRating);
      const historicalFraud = totalVotes > 4 ? matrixData.highRating / totalVotes : 0;
      const historicalText = `${matrixData.highRating}/${matrixData.midRating}/${matrixData.lowRating}`;

      // Calculate weighted fraud score
      const weightedFraud = (outOfOrderFraud * VOTER_FRAUD_WEIGHTS.outOfOrder
            + entrantFavoredFraud * VOTER_FRAUD_WEIGHTS.entrantFavored
            + historicalFraud * VOTER_FRAUD_WEIGHTS.historical)
          / Object.values(VOTER_FRAUD_WEIGHTS).reduce(
            (sum, weight) => sum + weight,
            0,
          );

      const score = Math.round(weightedFraud * 100);
      result[entrantId][username] = {
        outOfOrderFraud,
        entrantFavoredFraud,
        historicalFraud,
        entrantFavoredText,
        historicalText,
        score,
      };

      // Update highest score if this score is higher
      if (username !== entrantId && score > highest) {
        highest = score;
      }
    });

    // Store the highest score for this entrant
    result[entrantId].highest = highest;
  });

  return result;
}, [voterPatternsData, votingMatrixData, entrantsData]);

export default useFraudScores;
