/**
 * Moderator review of submitted content with enhanced fraud detection
 */

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/ANALYZE_VOTES');

// Fraud detection weights and thresholds
const FRAUD_WEIGHTS = {
  accountAge: 10, // Age of accounts
  karma: 5, // Karma for account
  voteCount: 10, // Number of votes in this contest
  randomScoring: 15, // Random scoring compared to average
  voteTiming: 15, // Time between votes
  votingZeros: 15, // Voting zeros
  historicalAnalysis: 30, // Historical analysis
};

// Helper function to calculate fraud score for a single metric
const calculateMetricScore = (value, thresholds) => {
  if (value <= thresholds.low) return 0;
  if (value >= thresholds.high) return 100;
  return ((value - thresholds.low) / (thresholds.high - thresholds.low)) * 100;
};

// Calculate account age suspiciousness (0-100)
const calculateAccountAgeScore = (ageInDays) => {
  const thresholds = { low: 365, high: 30 }; // 1 year = good, 30 days = suspicious
  return calculateMetricScore(ageInDays, thresholds);
};

// Calculate vote count suspiciousness (0-100)
const calculateVoteCountScore = (votesCast, totalEntries) => {
  const votePercentage = (votesCast / totalEntries) * 100;
  const thresholds = { low: 80, high: 20 }; // 80%+ = good, 20% = suspicious
  return calculateMetricScore(votePercentage, thresholds);
};

// Calculate random scoring suspiciousness (0-100)
const calculateRandomScoringScore = (userVotes, entryAverages) => {
  if (userVotes.length === 0) return 0;

  let totalDeviation = 0;
  let voteCount = 0;

  userVotes.forEach((vote) => {
    const entryAvg = entryAverages.find((e) => e.entryId === vote.entryId)?.average || 0;
    if (entryAvg > 0) {
      totalDeviation += Math.abs(vote.rating - entryAvg);
      voteCount += 1;
    }
  });

  if (voteCount === 0) return 0;

  const avgDeviation = totalDeviation / voteCount;
  // 0.5 deviation = good, 2.5 = suspicious
  const thresholds = { low: 0.5, high: 2.5 };
  return calculateMetricScore(avgDeviation, thresholds);
};

// Calculate vote timing suspiciousness (0-100)
const calculateVoteTimingScore = (votes) => {
  if (votes.length < 2) return 0;

  const sortedVotes = votes.sort(
    (a, b) => new Date(a.lastModified) - new Date(b.lastModified),
  );
  const timeIntervals = [];

  for (let i = 1; i < sortedVotes.length; i += 1) {
    const interval = new Date(sortedVotes[i].lastModified)
      - new Date(sortedVotes[i - 1].lastModified);
    timeIntervals.push(interval / 1000); // Convert to seconds
  }

  const avgInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0)
    / timeIntervals.length;
  const thresholds = { low: 20, high: 1 }; // 20 sec = good, 1 sec = suspicious
  return calculateMetricScore(avgInterval, thresholds);
};

// Calculate voting zeros suspiciousness (0-100)
const calculateVotingZerosScore = (votes) => {
  if (votes.length === 0) return 0;

  const zerosCount = votes.filter((v) => v.rating === 0).length;
  const zeroPercentage = (zerosCount / votes.length) * 100;

  const thresholds = { low: 5, high: 30 }; // 5% zeros = good, 30% = suspicious
  return calculateMetricScore(zeroPercentage, thresholds);
};

// Calculate karma suspiciousness (0-100)
const calculateKarmaScore = (karma) => {
  // Higher karma = less suspicious, lower karma = more suspicious
  // 1000+ karma = good, 100 karma = suspicious
  const thresholds = { low: 1000, high: 100 };
  return calculateMetricScore(karma, thresholds);
};

// Calculate historical analysis suspiciousness (0-100)
const calculateHistoricalAnalysisScore = async (username, contestId) => {
  // Get user's voting history across multiple contests
  const historicalVotes = await db.select(
    `SELECT v.rating, e.user as entry_user, v.contest_id
     FROM votes v
     JOIN entries e ON v.entry_id = e.id
     WHERE v.username = $1 AND v.contest_id != $2
     ORDER BY v.last_modified DESC
     LIMIT 100`,
    [username, contestId],
  );

  if (historicalVotes.length === 0) return 0;

  // Calculate how often user gives high scores to same entry creators
  const entryCreators = {};
  historicalVotes.forEach((vote) => {
    if (!entryCreators[vote.entryUser]) {
      entryCreators[vote.entryUser] = [];
    }
    entryCreators[vote.entryUser].push(vote.rating);
  });

  let suspiciousPatterns = 0;
  Object.values(entryCreators).forEach((ratings) => {
    if (ratings.length >= 3) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      if (avgRating >= 4.5) suspiciousPatterns += 1;
    }
  });

  const suspiciousPercentage = (suspiciousPatterns / Object.keys(entryCreators).length) * 100;
  const thresholds = { low: 30, high: 90 }; // 10% = good, 50% = suspicious
  return calculateMetricScore(suspiciousPercentage, thresholds);
};

// Calculate comprehensive fraud score
const calculateFraudScore = async (
  username,
  contestId,
  userVotes,
  entryAverages,
  ageInDays,
  votesCast,
  totalEntries,
  karma,
) => {
  try {
    // Calculate individual metric scores
    const accountAgeScore = calculateAccountAgeScore(ageInDays);
    const karmaScore = calculateKarmaScore(karma);
    const voteCountScore = calculateVoteCountScore(votesCast, totalEntries);
    const randomScoringScore = calculateRandomScoringScore(
      userVotes,
      entryAverages,
    );
    const voteTimingScore = calculateVoteTimingScore(userVotes);
    const votingZerosScore = calculateVotingZerosScore(userVotes);
    const historicalAnalysisScore = await calculateHistoricalAnalysisScore(
      username,
      contestId,
    );

    // Calculate weighted total score
    const weightedScore = (accountAgeScore * FRAUD_WEIGHTS.accountAge
        + karmaScore * FRAUD_WEIGHTS.karma
        + voteCountScore * FRAUD_WEIGHTS.voteCount
        + randomScoringScore * FRAUD_WEIGHTS.randomScoring
        + voteTimingScore * FRAUD_WEIGHTS.voteTiming
        + votingZerosScore * FRAUD_WEIGHTS.votingZeros
        + historicalAnalysisScore * FRAUD_WEIGHTS.historicalAnalysis)
      / Object.values(FRAUD_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

    return {
      totalScore: Math.round(weightedScore),
      breakdown: {
        accountAge: Math.round(accountAgeScore),
        karma: Math.round(karmaScore),
        voteCount: Math.round(voteCountScore),
        randomScoring: Math.round(randomScoringScore),
        voteTiming: Math.round(voteTimingScore),
        votingZeros: Math.round(votingZerosScore),
        historicalAnalysis: Math.round(historicalAnalysisScore),
      },
    };
  } catch (err) {
    logger.error(`Error calculating fraud score for ${username}: ${err}`);
    return { totalScore: 0, breakdown: {} };
  }
};

const getVotersData = async (contestId) => {
  // Get basic voter data
  const votersData = await db.select(
    `SELECT 
      u.username,
      u.karma,
      u.created_date,
      EXTRACT(EPOCH FROM (NOW() - u.created_date)) / 86400 AS age_in_days,
      COUNT(v.entry_id) as votes_cast,
      (SELECT COUNT(DISTINCT ce.entry_id) 
       FROM contest_entries ce 
       JOIN entries e ON ce.entry_id = e.id 
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved') as total_approved_entries,
      ROUND((COUNT(v.entry_id)::float / 
        (SELECT COUNT(DISTINCT ce.entry_id)::float 
         FROM contest_entries ce 
         JOIN entries e ON ce.entry_id = e.id 
         WHERE ce.contest_id = $1 AND e.submission_status = 'approved') * 100)::numeric, 1) as vote_percentage
    FROM users u
    LEFT JOIN votes v ON u.username = v.username AND v.contest_id = $1
    GROUP BY u.username, u.karma, u.created_date
    HAVING COUNT(v.entry_id) > 0
    ORDER BY vote_percentage DESC, u.username ASC`,
    [contestId],
  );

  // Get all votes for this contest
  const allVotes = await db.select(
    `SELECT v.username, v.entry_id, v.rating, v.last_modified
     FROM votes v
     WHERE v.contest_id = $1`,
    [contestId],
  );

  // Get entry averages
  const entryAverages = await db.select(
    `SELECT e.id as entry_id, cs.average
     FROM entries e
     JOIN contest_entries ce ON e.id = ce.entry_id
     LEFT JOIN contests_summary cs ON e.id = cs.entry_id AND cs.contest_id = $1
     WHERE ce.contest_id = $1 AND e.submission_status = 'approved'
     ORDER BY cs.average DESC NULLS LAST`,
    [contestId],
  );

  // Calculate fraud scores for each voter
  const enhancedVotersData = await Promise.all(
    votersData.map(async (voter) => {
      const userVotes = allVotes.filter((v) => v.username === voter.username);
      const fraudScore = await calculateFraudScore(
        voter.username,
        contestId,
        userVotes,
        entryAverages,
        voter.ageInDays,
        voter.votesCast,
        voter.totalApprovedEntries,
        voter.karma,
      );

      return {
        ...voter,
        fraudScore: fraudScore.totalScore,
        fraudBreakdown: fraudScore.breakdown,
      };
    }),
  );

  return enhancedVotersData;
};

exports.get = async ({ params: { id } }, res) => {
  try {
    const votersData = await getVotersData(id);

    res.send({ voters: votersData });
  } catch (err) {
    logger.error(`Error getting /contestVoters/${id}/voters: ${err}`);
    res.status(500).send();
  }
};
