import { useMemo } from 'react';

const VOTER_TRUST_WEIGHTS = {
  karma: 10,
  age: 25,
  percentVoted: 20,
  timeBetweenVotes: 20,
  ratedZeros: 5,
  randomness: 20,
};

const useDistrustScores = (votersData, voterPatternsData, numberOfEntries) => useMemo(() => {
  if (!votersData || !voterPatternsData || !numberOfEntries) {
    return {};
  }

  const scores = {};

  Object.keys(votersData).forEach((username) => {
    const voterData = votersData[username];
    const patternData = voterPatternsData[username];

    if (!voterData || !patternData) {
      return;
    }

    // Calculate all distrust metrics in one pass
    const karmaDistrust = 1 - Math.min(voterData.karma / 1000, 1);
    const karmaText = `${voterData.karma}`;

    const ageDistrust = 1 - Math.min(voterData.ageInDays / 365, 1);
    const ageText = `${voterData.ageInDays} days`;

    const percentVotedDistrust = 1 - Math.min(patternData.voteCount / numberOfEntries, 1);
    const percentVotedText = `Voted on ${patternData.voteCount}/${numberOfEntries} entries`;

    const timeBetweenVotesDistrust = patternData.medianTimeBetweenVotes
      ? Math.max(
        0,
        Math.min(1, (10 - patternData.medianTimeBetweenVotes) / 7),
      )
      : 0.5;
    const timeBetweenVotesText = patternData.medianTimeBetweenVotes
      ? `${patternData.medianTimeBetweenVotes.toFixed(1)} seconds`
      : 'No time data available';

    const ratedZerosDistrust = patternData.hasGivenZeroRatings ? 1 : 0;
    const ratedZerosText = patternData.hasGivenZeroRatings
      ? 'Gave zero ratings'
      : 'No zero ratings given';

    const randomnessDistrust = 1 - Math.exp(-patternData.randomnessMetric);
    const randomnessText = `${patternData.randomnessMetric.toFixed(2)}`;

    // Calculate weighted distrust score
    const weightedDistrust = (karmaDistrust * VOTER_TRUST_WEIGHTS.karma
          + ageDistrust * VOTER_TRUST_WEIGHTS.age
          + percentVotedDistrust * VOTER_TRUST_WEIGHTS.percentVoted
          + timeBetweenVotesDistrust * VOTER_TRUST_WEIGHTS.timeBetweenVotes
          + ratedZerosDistrust * VOTER_TRUST_WEIGHTS.ratedZeros
          + randomnessDistrust * VOTER_TRUST_WEIGHTS.randomness)
        / Object.values(VOTER_TRUST_WEIGHTS).reduce(
          (sum, weight) => sum + weight,
          0,
        );

    scores[username] = {
      karmaDistrust,
      ageDistrust,
      percentVotedDistrust,
      timeBetweenVotesDistrust,
      ratedZerosDistrust,
      randomnessDistrust,
      karmaText,
      ageText,
      percentVotedText,
      timeBetweenVotesText,
      ratedZerosText,
      randomnessText,
      score: Math.round(weightedDistrust * 100),
    };
  });

  return scores;
}, [votersData, voterPatternsData, numberOfEntries]);

export default useDistrustScores;
