const db = require('../db');
const { createLogger } = require('../logger');
const { getHash } = require('../util');

const logger = createLogger('API/ANALYZE_CONTEST');

/**
 * Get contest entrants analysis
 */
exports.entrants = async ({ params: { id } }, res) => {
  try {
    logger.debug(`Entrants analysis requested for contest: ${id}`);

    // Get all approved entries for the contest with DQ status in a single query
    const approvedEntries = await db.select(
      `SELECT e.id as entry_id, e.user, 
              CASE WHEN ed.entry_id IS NOT NULL THEN true ELSE false END as dq
       FROM entries e
       JOIN contest_entries ce ON e.id = ce.entry_id
       LEFT JOIN entry_dqs ed ON e.id = ed.entry_id
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved'
       ORDER BY e.id`,
      [id],
    );

    if (!approvedEntries.length) {
      logger.warn(`No approved entries found for contest: ${id}`);
      res
        .status(404)
        .send({ message: 'No approved entries found for this contest' });
      return;
    }

    // Build the response object - group by username with arrays of entries
    const entrants = {};
    approvedEntries.forEach(({ user, dq, entryId }) => {
      if (!entrants[user]) {
        entrants[user] = [];
      }
      entrants[user].push({
        entryId,
        dq,
      });
    });

    res.status(200).send({ entrants, numberOfEntries: approvedEntries.length });
  } catch (err) {
    logger.error(`Error in entrants analysis: ${err}`);
    res.status(500).send();
  }
};

/**
 * Get contest voters analysis
 */
exports.voters = async ({ params: { id } }, res) => {
  try {
    logger.debug(`Voters analysis requested for contest: ${id}`);

    // Get all voters with account age, karma, and DQ status in a single query
    const votersData = await db.select(
      `SELECT 
        u.username,
        u.karma,
        u.created_date,
        EXTRACT(EPOCH FROM (NOW() - u.created_date)) / 86400 AS age_in_days,
        (SELECT vd2.type FROM voter_dqs vd2 WHERE vd2.username = u.username AND vd2.contest_id = $1 LIMIT 1) as dq_type
      FROM users u
      JOIN votes v ON u.username = v.username
      WHERE v.contest_id = $1
      GROUP BY u.username, u.karma, u.created_date
      ORDER BY u.username ASC`,
      [id],
    );

    if (!votersData.length) {
      logger.warn('No voters found');
      res.status(404).send({ message: 'No voters found' });
      return;
    }

    // Build the response object
    const voters = {};
    votersData.forEach(({
      username, karma, ageInDays, dqType,
    }) => {
      voters[username] = {
        karma,
        ageInDays: Math.round(ageInDays),
        dq: dqType || '',
      };
    });

    res.status(200).send(voters);
  } catch (err) {
    logger.error(`Error in voters analysis: ${err}`);
    res.status(500).send();
  }
};

/**
 * Get contest voter patterns analysis
 */
exports.voterPatterns = async ({ params: { id } }, res) => {
  try {
    logger.debug(`Voter patterns analysis requested for contest: ${id}`);

    // Helper function to calculate median
    const calculateMedian = (numbers) => {
      if (numbers.length === 0) return null;
      const sorted = numbers.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    };

    // Helper function to calculate randomness metric
    const calculateRandomnessMetric = (userVotes, entryAverages) => {
      if (userVotes.length === 0) return 0;

      let totalDeviation = 0;
      let voteCount = 0;

      userVotes.forEach((vote) => {
        const entryAvg = entryAverages.find((e) => e.entry_id === vote.entryId)?.average || 0;
        if (entryAvg > 0) {
          totalDeviation += Math.abs(vote.rating - entryAvg);
          voteCount += 1;
        }
      });

      return voteCount > 0 ? totalDeviation / voteCount : 0;
    };

    // Get all users who have voted in this contest with their vote details
    const votersData = await db.select(
      `SELECT 
        v.username,
        v.entry_id,
        v.rating,
        v.last_modified,
        COUNT(*) OVER (PARTITION BY v.username) as vote_count
      FROM votes v
      WHERE v.contest_id = $1
      ORDER BY v.username, v.last_modified`,
      [id],
    );

    if (!votersData.length) {
      logger.warn(`No voters found for contest: ${id}`);
      res.status(404).send({ message: 'No voters found for this contest' });
      return;
    }

    // Get entry averages for randomness calculation - calculate directly instead of using
    // materialized view
    const entryAverages = await db.select(
      `SELECT e.id as entry_id, 
              COALESCE(AVG(v.rating), 0) as average
       FROM entries e
       JOIN contest_entries ce ON e.id = ce.entry_id
       LEFT JOIN votes v ON e.id = v.entry_id AND v.contest_id = $1
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved'
       GROUP BY e.id
       ORDER BY average DESC`,
      [id],
    );

    // Get all entry IDs for the current contest and sort them using getHash
    const contestEntries = await db.select(
      `SELECT e.id as entry_id
       FROM entries e
       JOIN contest_entries ce ON e.id = ce.entry_id
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved'
       ORDER BY e.id`,
      [id],
    );

    // Sort entry IDs using getHash function (using a dummy username for consistent sorting)
    const sortedEntryIds = contestEntries
      .map((entry) => entry.entry_id)
      .sort((a, b) => getHash('dummy', a) - getHash('dummy', b));

    // Helper function to determine voting order pattern
    const determineVotingOrder = (userVotes, entryIdsSorted) => {
      if (userVotes.length < 2) return null; // Not enough votes to determine pattern

      const userVoteEntryIds = userVotes.map((vote) => vote.entryId);
      const totalFlags = entryIdsSorted.length;
      const votePercentage = userVoteEntryIds.length / totalFlags;

      // If user voted on over 60% of flags, determine if they started from first flag
      if (votePercentage > 0.6) {
        const firstFlag = entryIdsSorted[0];
        const votedOnFirstFlag = userVoteEntryIds.includes(firstFlag);

        if (votedOnFirstFlag) {
          return 'start';
        }
        return 'straight';
      }

      // Check if user voted on sequential flags
      let sequentialCount = 0;
      let currentIndex = 0;

      userVoteEntryIds.forEach((voteEntryId) => {
        const expectedIndex = entryIdsSorted.indexOf(voteEntryId);
        if (expectedIndex >= currentIndex) {
          sequentialCount += 1;
          currentIndex = expectedIndex + 1;
        }
      });

      const sequentialRatio = sequentialCount / userVoteEntryIds.length;

      if (sequentialRatio >= 0.8) {
        // Check if user voted on the first flag
        const firstFlag = entryIdsSorted[0];
        const votedOnFirstFlag = userVoteEntryIds.includes(firstFlag);

        if (votedOnFirstFlag) {
          return 'start';
        }
        return 'straight';
      }
      return 'random';
    };

    // Group votes by user
    const userVotes = {};
    votersData.forEach((vote) => {
      if (!userVotes[vote.username]) {
        userVotes[vote.username] = [];
      }
      userVotes[vote.username].push({
        entryId: vote.entry_id,
        rating: vote.rating,
        lastModified: vote.last_modified,
      });
    });

    // Calculate patterns for each user
    const patterns = {};
    Object.keys(userVotes).forEach((username) => {
      const votes = userVotes[username];

      // a) Number of votes
      const voteCount = votes.length;

      // b) Randomness metric
      const randomnessMetric = calculateRandomnessMetric(votes, entryAverages);

      // c) Median time between votes
      const timeIntervals = [];
      if (votes.length > 1) {
        const sortedVotes = votes.sort(
          (a, b) => new Date(a.lastModified) - new Date(b.lastModified),
        );
        for (let i = 1; i < sortedVotes.length; i += 1) {
          const interval = new Date(sortedVotes[i].lastModified)
            - new Date(sortedVotes[i - 1].lastModified);
          timeIntervals.push(interval / 1000); // Convert to seconds
        }
      }
      const medianTimeBetweenVotes = calculateMedian(timeIntervals);

      // d) Whether user has given any 0 ratings
      const hasGivenZeroRatings = votes.some((vote) => vote.rating === 0);

      // e) Average vote rating
      const averageVoteRating = votes.length > 0
        ? Math.round(
          (votes.reduce((sum, vote) => sum + vote.rating, 0)
                / votes.length)
                * 100,
        ) / 100
        : 0;

      // f) Voting order pattern
      const votingOrder = determineVotingOrder(votes, sortedEntryIds);

      patterns[username] = {
        voteCount,
        randomnessMetric: Math.round(randomnessMetric * 100) / 100, // Round to 2 decimal places
        medianTimeBetweenVotes: medianTimeBetweenVotes
          ? Math.round(medianTimeBetweenVotes)
          : null,
        hasGivenZeroRatings,
        averageVoteRating,
        votingOrder,
      };
    });

    res.status(200).send(patterns);
  } catch (err) {
    logger.error(`Error in voter patterns analysis: ${err}`);
    res.status(500).send();
  }
};

/**
 * Get contest voting matrix analysis
 */
exports.votingMatrix = async ({ params: { id } }, res) => {
  try {
    logger.debug(`Voting matrix analysis requested for contest: ${id}`);

    // Get voting matrix for voters who participated in the specified contest
    const matrix = await db.select(
      `SELECT
        v.username as voter,
        e.user as entrant,
        COUNT(*) as total_votes,
        COUNT(*) FILTER (WHERE v.rating BETWEEN 4 AND 5) as high_rating,
        COUNT(*) FILTER (WHERE v.rating BETWEEN 2 AND 3) as mid_rating,
        COUNT(*) FILTER (WHERE v.rating BETWEEN 0 AND 1) as low_rating
      FROM vexillology_contests.votes v
      LEFT JOIN vexillology_contests.entries e ON v.entry_id = e.id
      WHERE e.user IN (
        SELECT DISTINCT e2.user 
        FROM vexillology_contests.entries e2
        JOIN contest_entries ce ON e2.id = ce.entry_id
        WHERE ce.contest_id = $1
      )
      GROUP BY v.username, e.user
      ORDER BY voter, entrant`,
      [id],
    );

    // Get contest-specific average ratings for the provided contest_id
    const contestAverages = await db.select(
      `SELECT
        v.username as voter,
        e.user as entrant,
        AVG(v.rating) as contest_average_rating
      FROM vexillology_contests.votes v
      LEFT JOIN vexillology_contests.entries e ON v.entry_id = e.id
      JOIN contest_entries ce ON e.id = ce.entry_id
      WHERE ce.contest_id = $1
      GROUP BY v.username, e.user
      ORDER BY voter, entrant`,
      [id],
    );

    if (!matrix.length) {
      logger.warn(`No voting data found for contest: ${id}`);
      res.status(404).send({ message: 'No voting data found for this contest' });
      return;
    }

    // Create a lookup map for contest averages
    const contestAveragesMap = {};
    contestAverages.forEach(({ voter, entrant, contestAverageRating }) => {
      if (!contestAveragesMap[entrant]) {
        contestAveragesMap[entrant] = {};
      }
      contestAveragesMap[entrant][voter] = contestAverageRating;
    });

    // Restructure the matrix to group by entrant, then by voter
    const restructuredMatrix = {};
    matrix.forEach(({ entrant, voter, ...stats }) => {
      if (!restructuredMatrix[entrant]) {
        restructuredMatrix[entrant] = {};
      }

      // Add contest average rating if available
      const contestAverageRating = contestAveragesMap[entrant]?.[voter];
      restructuredMatrix[entrant][voter] = {
        ...stats,
        contestAverageRating: contestAverageRating
          ? Math.round(contestAverageRating * 10) / 10
          : null,
      };
    });

    res.status(200).send(restructuredMatrix);
  } catch (err) {
    logger.error(`Error in voting matrix analysis: ${err}`);
    res.status(500).send();
  }
};
