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

    // Iterate through all voters for this entrant
    Object.keys(voterPatternsData).forEach((username) => {
      const patternData = voterPatternsData[username];
      if (!patternData) {
        return;
      }

      const matrixData = votingMatrixData[entrantId]?.[username];

      // Check if there's voting matrix data for this entrant-voter pair
      if (!matrixData || matrixData.contestAverageRating === null) {
        result[entrantId][username] = '-';
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
      if (matrixData.contestAverageRating < 4.5) {
        entrantFavoredFraud = 0;
      } else if (patternData.averageVoteRating < 2) {
        entrantFavoredFraud = 1;
      } else if (patternData.randomnessMetric > 1) {
        entrantFavoredFraud = 0.8;
      } else if (patternData.averageVoteRating < 3) {
        entrantFavoredFraud = 0.6;
      } else {
        entrantFavoredFraud = 0.2;
      }

      // historical: percentage of high ratings
      const totalVotes = matrixData.highRating + matrixData.midRating + matrixData.lowRating;
      const historicalFraud = totalVotes > 0 ? matrixData.highRating / totalVotes : 0;

      // Calculate weighted fraud score
      const weightedFraud = (outOfOrderFraud * VOTER_FRAUD_WEIGHTS.outOfOrder
            + entrantFavoredFraud * VOTER_FRAUD_WEIGHTS.entrantFavored
            + historicalFraud * VOTER_FRAUD_WEIGHTS.historical)
          / Object.values(VOTER_FRAUD_WEIGHTS).reduce(
            (sum, weight) => sum + weight,
            0,
          );

      result[entrantId][username] = {
        outOfOrderFraud,
        entrantFavoredFraud,
        historicalFraud,
        weightedFraudScore: Math.round(weightedFraud * 100),
      };
    });
  });

  return result;
}, [voterPatternsData, votingMatrixData, entrantsData]);

export default useFraudScores;
