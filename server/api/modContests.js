const { isFuture } = require('date-fns');

const {
  getContestId,
  getDefaultContestDates,
  getMonthBounds,
  getMonthRangeError,
  getPastMonthError,
  getScheduleOrderError,
} = require('../contestSchedule');
const {
  addCategories,
  addContest,
  deleteContest,
  getAllContests,
  getCategories,
  getContestById,
  getContestForMonth,
  getPreviousContest,
  getUsedCategories,
  hasContestEntries,
  removeCategories,
  renameContestId,
  updateContest,
} = require('../db/queries');
const { createLogger } = require('../logger');

const logger = createLogger('API/MOD_CONTESTS');

// A contest is "upcoming" - and so still safe to rename or delete - only while its
// submission window hasn't opened and no entries have been submitted to it yet.
const isUpcoming = async (contest) => {
  const submissionsHaveStarted = contest.submissionStart && !isFuture(contest.submissionStart);
  if (submissionsHaveStarted) {
    return false;
  }
  return !(await hasContestEntries(contest.id));
};

// Submission start is allowed to precede its own contest's month, but not so far that it
// intrudes on the previous contest's own submission/voting window.
const getSubmissionOverlapError = (submissionStart, previousContest) => {
  if (!submissionStart || !previousContest?.voteEnd) {
    return null;
  }
  if (new Date(submissionStart) < new Date(previousContest.voteEnd)) {
    return `Submission start can't be before "${previousContest.name}"'s voting window ends.`;
  }
  return null;
};

exports.getDefaultSchedule = async ({ query: { date, excludeId } }, res) => {
  if (!date) {
    res.status(400).send('Missing required query param: date');
    return;
  }

  try {
    const defaults = getDefaultContestDates(date);
    const bounds = getMonthBounds(date);
    const [existingContest, previousContest] = await Promise.all([
      getContestForMonth(date, excludeId),
      getPreviousContest(date, excludeId),
    ]);
    res.send({
      ...defaults,
      ...bounds,
      existingContestName: existingContest?.name || null,
      previousContestName: previousContest?.name || null,
      previousContestVoteEnd: previousContest?.voteEnd || null,
    });
  } catch (err) {
    logger.error(`Error getting /mod/contestSchedule: ${err.message || err}`);
    res.status(500).send();
  }
};

exports.getAll = async (req, res) => {
  try {
    const contests = await getAllContests();
    res.send({
      contests: contests.map(({ date, ...rest }) => ({
        ...rest,
        date: date.toJSON().substr(0, 10),
      })),
    });
  } catch (err) {
    logger.error(`Error getting /mod/contests: ${err.message || err}`);
    res.status(500).send();
  }
};

exports.getOne = async ({ params: { id } }, res) => {
  try {
    const contest = await getContestById(id);
    if (!contest) {
      res.status(404).send('Contest with that id not found');
      return;
    }

    const [categories, usedCategories] = await Promise.all([
      getCategories(id),
      getUsedCategories(id),
    ]);

    const { date, ...rest } = contest;
    res.send({
      ...rest,
      date: date.toJSON().substr(0, 10),
      categories: categories.map((category) => ({
        category,
        used: usedCategories.includes(category),
      })),
    });
  } catch (err) {
    logger.error(`Error getting /mod/contests/${id}: ${err.message || err}`);
    res.status(500).send();
  }
};

exports.post = async ({ body }, res) => {
  logger.debug(`Posting /mod/contests with body: ${JSON.stringify(body)}`);
  const {
    categories,
    date,
    name,
    prompt,
    submissionEnd,
    submissionStart,
    voteEnd,
    voteStart,
  } = body;

  const scheduleError = getScheduleOrderError({
    submissionStart,
    submissionEnd,
    voteStart,
    voteEnd,
  })
    || getMonthRangeError({
      date,
      submissionEnd,
      voteStart,
      voteEnd,
    })
    || getPastMonthError(date);
  if (scheduleError) {
    res.status(400).send(scheduleError);
    return;
  }

  try {
    const existingContest = await getContestForMonth(date);
    if (existingContest) {
      res
        .status(400)
        .send(
          `A contest already exists for this month: "${existingContest.name}".`,
        );
      return;
    }

    const previousContest = await getPreviousContest(date);
    const overlapError = getSubmissionOverlapError(
      submissionStart,
      previousContest,
    );
    if (overlapError) {
      res.status(400).send(overlapError);
      return;
    }

    await addContest({
      categories,
      date,
      name,
      prompt,
      submissionEnd,
      submissionStart,
      voteEnd,
      voteStart,
    });
    logger.info(`Successfully added contest '${name}' (${date})`);
    res.status(201).send({ message: 'Contest created successfully' });
  } catch (err) {
    logger.error(`Error posting /mod/contests: ${err.message || err}`);
    res.status(500).send(err.message || 'Failed to create contest');
  }
};

exports.put = async ({ params: { id }, body }, res) => {
  logger.debug(
    `Putting /mod/contests/${id} with body: ${JSON.stringify(body)}`,
  );
  const {
    categories = [],
    date,
    name,
    prompt,
    submissionEnd,
    submissionStart,
    voteEnd,
    voteStart,
  } = body;

  const scheduleError = getScheduleOrderError({
    submissionStart,
    submissionEnd,
    voteStart,
    voteEnd,
  })
    || getMonthRangeError({
      date,
      submissionEnd,
      voteStart,
      voteEnd,
    })
    || getPastMonthError(date);
  if (scheduleError) {
    res.status(400).send(scheduleError);
    return;
  }

  try {
    const contest = await getContestById(id);
    if (!contest) {
      res.status(404).send('Contest with that id not found');
      return;
    }
    if (contest.resultsCertified) {
      res
        .status(400)
        .send(
          'Contest results have already been certified and can no longer be edited',
        );
      return;
    }

    const existingContest = await getContestForMonth(date, id);
    if (existingContest) {
      res
        .status(400)
        .send(
          `A contest already exists for this month: "${existingContest.name}".`,
        );
      return;
    }

    const previousContest = await getPreviousContest(date, id);
    const overlapError = getSubmissionOverlapError(
      submissionStart,
      previousContest,
    );
    if (overlapError) {
      res.status(400).send(overlapError);
      return;
    }

    let effectiveId = id;
    const computedId = getContestId(date);
    if (computedId !== id && (await isUpcoming(contest))) {
      await renameContestId(id, computedId);
      effectiveId = computedId;
    }

    const updatedContest = await updateContest({
      id: effectiveId,
      name,
      date,
      prompt,
      submissionStart,
      submissionEnd,
      voteStart,
      voteEnd,
    });

    const existingCategories = await getCategories(effectiveId);
    const submittedCategories = categories
      .map((category) => category.trim())
      .filter(Boolean);
    const categoriesToAdd = submittedCategories.filter(
      (c) => !existingCategories.includes(c),
    );
    const categoriesToRemove = existingCategories.filter(
      (c) => !submittedCategories.includes(c),
    );

    if (categoriesToRemove.length) {
      const usedCategories = await getUsedCategories(effectiveId);
      const blockedCategories = categoriesToRemove.filter((c) => usedCategories.includes(c));
      if (blockedCategories.length) {
        res
          .status(400)
          .send(
            `Can't remove categories that already have submissions: ${blockedCategories.join(
              ', ',
            )}`,
          );
        return;
      }
      await removeCategories(effectiveId, categoriesToRemove);
    }

    if (categoriesToAdd.length) {
      await addCategories(effectiveId, categoriesToAdd);
    }

    res.send({ ...updatedContest, id: effectiveId });
  } catch (err) {
    logger.error(`Error putting /mod/contests/${id}: ${err.message || err}`);
    res.status(500).send(err.message || 'Failed to update contest');
  }
};

exports.delete = async ({ params: { id } }, res) => {
  logger.debug(`Deleting /mod/contests/${id}`);

  try {
    const contest = await getContestById(id);
    if (!contest) {
      res.status(404).send('Contest with that id not found');
      return;
    }
    if (!(await isUpcoming(contest))) {
      res
        .status(400)
        .send('Only upcoming contests without submissions can be deleted');
      return;
    }

    await deleteContest(id);
    logger.info(`Successfully deleted contest '${id}'`);
    res.send({ message: 'Contest deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting /mod/contests/${id}: ${err.message || err}`);
    res.status(500).send(err.message || 'Failed to delete contest');
  }
};
