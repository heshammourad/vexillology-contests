const { format, isAfter, isBefore } = require('date-fns');

const {
  getContestId,
  getDateFormatError,
  getDefaultContestDates,
  getMonthBounds,
  getMonthRangeError,
  getPastMonthError,
  getScheduleOrderError,
} = require('../../contestSchedule');
const { getCategories } = require('../../db/queries');
const { createLogger } = require('../../logger');

const {
  addContest,
  deleteContest,
  getContestById,
  getContestForMonth,
  getNextContest,
  getPreviousContest,
  getUncertifiedContests,
  getUsedCategories,
  hasContestEntries,
  updateContest,
} = require('./db');

const logger = createLogger('API/MOD_CONTESTS');

// node-postgres parses a DATE column as local midnight, so read it back with local getters;
// toJSON() would shift it a day on a server east of UTC.
const toDateString = (date) => format(date, 'yyyy-MM-dd');

// A contest's id follows its month (e.g. nov26), so it can only be renamed - or deleted -
// while nothing references it yet: its submissions haven't opened and it has no entries.
const canRenameOrDelete = async (contest) => isAfter(contest.submissionStart, new Date())
  && !(await hasContestEntries(contest.id));

// Trimmed, without blanks or duplicates, so create and edit store the same names.
const normalizeCategories = (categories) => [
  ...new Set(categories.map((category) => category.trim()).filter(Boolean)),
];

/**
 * Validates the parts of a create/edit body that don't need the database. All four
 * timestamps are required, so callers fill in any defaults first (post does).
 *
 * @returns {string|null} An error message, or null if the body is valid.
 */
const getBodyError = ({
  categories,
  date,
  name,
  prompt,
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
}) => {
  const dateError = getDateFormatError(date);
  if (dateError) {
    return dateError;
  }
  // checkRequiredFields only tests presence, so whitespace-only or non-string values get here.
  if (typeof name !== 'string' || !name.trim()) {
    return 'Contest name is required.';
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return 'Prompt is required.';
  }
  if (
    categories != null
    && !(
      Array.isArray(categories)
      && categories.every((c) => typeof c === 'string')
    )
  ) {
    return 'Categories must be a list of names.';
  }
  // The checks below and getOtherContestsError would pass silently on a missing timestamp.
  if (![submissionStart, submissionEnd, voteStart, voteEnd].every(Boolean)) {
    return 'Submission and vote start and end times are required.';
  }
  return (
    getScheduleOrderError({
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
  );
};

/**
 * Looks up the contests a contest's schedule is checked against: another regular contest in
 * the same month, and the contests before and after it.
 *
 * @param {string} date
 * @param {string} [excludeId] - The contest being edited, left out of the search.
 */
const getNeighbouringContests = async (date, excludeId) => {
  const [sameMonthContest, previousContest, nextContest] = await Promise.all([
    getContestForMonth(date, excludeId),
    getPreviousContest(date, excludeId),
    getNextContest(date, excludeId),
  ]);
  return { sameMonthContest, previousContest, nextContest };
};

/**
 * Checks a contest's schedule against the other regular contests: only one per month, its
 * submissions can open early but not before the previous contest's voting ends, and its
 * voting must end before the next contest's submissions open.
 *
 * @param {Object} params
 * @param {string} [params.excludeId] - The contest being edited, left out of the search.
 * @returns {Promise<string|null>} An error message, or null if nothing conflicts.
 */
const getOtherContestsError = async ({
  date,
  submissionStart,
  voteEnd,
  excludeId,
}) => {
  const neighbours = await getNeighbouringContests(date, excludeId);
  const { sameMonthContest, previousContest, nextContest } = neighbours;
  if (sameMonthContest) {
    return `A contest already exists for this month: "${sameMonthContest.name}".`;
  }
  if (
    previousContest
    && isBefore(new Date(submissionStart), previousContest.voteEnd)
  ) {
    return `Submission start can't be before "${previousContest.name}"'s voting window ends.`;
  }
  if (nextContest && isAfter(new Date(voteEnd), nextContest.submissionStart)) {
    return `Vote end can't be after "${nextContest.name}"'s submissions open.`;
  }
  return null;
};

// A contest's id comes from its month (e.g. nov26), but another row can already have it,
// such as an older contest whose date doesn't match its id.
const getIdTakenError = async (id) => ((await getContestById(id))
  ? `Another contest already has the id "${id}".`
  : null);

/**
 * Loads a contest this page may manage, or sends the 404/400 response and returns null.
 * Year-end (Best of) contests are created by create_best_of_year_contest on a fixed schedule
 * that doesn't start on the 1st, which the page's month picker can't represent.
 */
const getManageableContest = async (id, res) => {
  const contest = await getContestById(id);
  if (!contest) {
    res.status(404).send('Contest with that id not found');
    return null;
  }
  if (contest.yearEnd) {
    res.status(400).send("Year-end contests can't be managed here");
    return null;
  }
  return contest;
};

exports.getMonthSchedule = async ({ query: { date, excludeId } }, res) => {
  const dateError = getDateFormatError(date);
  if (dateError) {
    res.status(400).send(dateError);
    return;
  }

  try {
    const neighbours = await getNeighbouringContests(date, excludeId);
    const { sameMonthContest, previousContest, nextContest } = neighbours;
    res.send({
      ...getDefaultContestDates(date),
      ...getMonthBounds(date),
      sameMonthContestName: sameMonthContest?.name || null,
      previousContestName: previousContest?.name || null,
      previousContestVoteEnd: previousContest?.voteEnd || null,
      nextContestName: nextContest?.name || null,
      nextContestSubmissionStart: nextContest?.submissionStart || null,
    });
  } catch (err) {
    logger.error(`Error getting /mod/contestSchedule: ${err.message || err}`);
    res.status(500).send();
  }
};

exports.getUncertified = async (req, res) => {
  try {
    const contests = await getUncertifiedContests();
    res.send({
      contests: contests.map(({ date, ...rest }) => ({
        ...rest,
        date: toDateString(date),
      })),
    });
  } catch (err) {
    logger.error(`Error getting /mod/contests: ${err.message || err}`);
    res.status(500).send();
  }
};

exports.getOne = async ({ params: { id } }, res) => {
  try {
    const contest = await getManageableContest(id, res);
    if (!contest) {
      return;
    }

    const [categories, usedCategories] = await Promise.all([
      getCategories(id),
      getUsedCategories(id),
    ]);

    const { date, ...rest } = contest;
    res.send({
      ...rest,
      date: toDateString(date),
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
    categories, date, name, prompt,
  } = body;

  const dateError = getDateFormatError(date);
  if (dateError) {
    res.status(400).send(dateError);
    return;
  }

  // Missing timestamps fall back to the default schedule, so validate the merged result
  // rather than only the ones provided.
  const defaults = getDefaultContestDates(date);
  const contest = {
    categories,
    date,
    name,
    prompt,
    submissionStart: body.submissionStart || defaults.submissionStart,
    submissionEnd: body.submissionEnd || defaults.submissionEnd,
    voteStart: body.voteStart || defaults.voteStart,
    voteEnd: body.voteEnd || defaults.voteEnd,
  };

  const bodyError = getBodyError(contest) || getPastMonthError(date);
  if (bodyError) {
    res.status(400).send(bodyError);
    return;
  }

  try {
    const otherContestsError = await getOtherContestsError(contest);
    if (otherContestsError) {
      res.status(400).send(otherContestsError);
      return;
    }

    const id = getContestId(date);
    const idTakenError = await getIdTakenError(id);
    if (idTakenError) {
      res.status(400).send(idTakenError);
      return;
    }

    await addContest({
      ...contest,
      id,
      name: name.trim(),
      prompt: prompt.trim(),
      categories: categories ? normalizeCategories(categories) : [],
    });
    logger.info(`Successfully added contest '${name}' (${date})`);
    res.status(201).send({ message: 'Contest created successfully' });
  } catch (err) {
    logger.error(`Error posting /mod/contests: ${err.message || err}`);
    res.status(500).send('Failed to create contest');
  }
};

exports.put = async ({ params: { id }, body }, res) => {
  logger.debug(
    `Putting /mod/contests/${id} with body: ${JSON.stringify(body)}`,
  );
  const {
    categories, date, name, prompt, submissionStart, voteEnd,
  } = body;

  const bodyError = getBodyError(body);
  if (bodyError) {
    res.status(400).send(bodyError);
    return;
  }

  try {
    const contest = await getManageableContest(id, res);
    if (!contest) {
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

    // Only a move to another month has to land in the present or future, so a contest
    // still awaiting certification after its month ends can have its name or prompt fixed.
    const monthChanged = date !== toDateString(contest.date);
    const pastMonthError = monthChanged && getPastMonthError(date);
    if (pastMonthError) {
      res.status(400).send(pastMonthError);
      return;
    }

    const otherContestsError = await getOtherContestsError({
      date,
      submissionStart,
      voteEnd,
      excludeId: id,
    });
    if (otherContestsError) {
      res.status(400).send(otherContestsError);
      return;
    }

    // Validate the category changes before writing anything, so a rejected edit doesn't
    // leave the contest half-updated. Leaving categories out of the body keeps the current ones.
    const existingCategories = await getCategories(id);
    const submittedCategories = categories
      ? normalizeCategories(categories)
      : existingCategories;
    const categoriesToAdd = submittedCategories.filter(
      (c) => !existingCategories.includes(c),
    );
    const categoriesToRemove = existingCategories.filter(
      (c) => !submittedCategories.includes(c),
    );

    if (categoriesToRemove.length) {
      const usedCategories = await getUsedCategories(id);
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
    }

    let newId = id;
    if (monthChanged) {
      if (!(await canRenameOrDelete(contest))) {
        res
          .status(400)
          .send(
            "Can't move a contest to another month once its submissions have opened.",
          );
        return;
      }
      newId = getContestId(date);
      const idTakenError = newId !== id && (await getIdTakenError(newId));
      if (idTakenError) {
        res.status(400).send(idTakenError);
        return;
      }
    }

    const updatedContest = await updateContest({
      ...body,
      id,
      newId,
      name: name.trim(),
      prompt: prompt.trim(),
      categoriesToAdd,
      categoriesToRemove,
    });

    res.send({ ...updatedContest, date: toDateString(updatedContest.date) });
  } catch (err) {
    logger.error(`Error putting /mod/contests/${id}: ${err.message || err}`);
    res.status(500).send('Failed to update contest');
  }
};

exports.delete = async ({ params: { id } }, res) => {
  logger.debug(`Deleting /mod/contests/${id}`);

  try {
    const contest = await getManageableContest(id, res);
    if (!contest) {
      return;
    }
    if (!(await canRenameOrDelete(contest))) {
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
    res.status(500).send('Failed to delete contest');
  }
};
