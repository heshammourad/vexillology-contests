const { isFuture } = require('date-fns');

const {
  getContestId,
  getDateFormatError,
  getDefaultContestDates,
  getMonthBounds,
  getMonthRangeError,
  getPastMonthError,
  getScheduleOrderError,
} = require('../contestSchedule');
const {
  addContest,
  deleteContest,
  getAllContests,
  getCategories,
  getContestById,
  getContestForMonth,
  getNextContest,
  getPreviousContest,
  getUsedCategories,
  hasContestEntries,
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

// Year-end (Best of) contests are created by create_best_of_year_contest on a fixed schedule
// that doesn't start on the 1st, which this page's month picker can't represent.
const YEAR_END_MESSAGE = "Year-end contests can't be managed here";

// Categories are optional, but when sent they must be a list of strings.
const isValidCategories = (categories) => categories == null
  || (Array.isArray(categories) && categories.every((c) => typeof c === 'string'));

// Trimmed, without blanks or duplicates, so create and edit store the same names.
const normalizeCategories = (categories) => [
  ...new Set(categories.map((category) => category.trim()).filter(Boolean)),
];

// checkRequiredFields only tests presence, so whitespace-only or non-string values get here.
const getTextFieldError = ({ name, prompt }) => {
  if (typeof name !== 'string' || !name.trim()) {
    return 'Contest name is required.';
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return 'Prompt is required.';
  }
  return null;
};

// Submission start is allowed to precede its own contest's month, but not so far that it
// intrudes on the previous contest's own submission/voting window. Likewise, voting can't run
// past the point the next contest opens its submissions.
const getOverlapError = ({
  submissionStart,
  voteEnd,
  previousContest,
  nextContest,
}) => {
  if (
    submissionStart
    && previousContest?.voteEnd
    && new Date(submissionStart) < new Date(previousContest.voteEnd)
  ) {
    return `Submission start can't be before "${previousContest.name}"'s voting window ends.`;
  }
  if (
    voteEnd
    && nextContest?.submissionStart
    && new Date(voteEnd) > new Date(nextContest.submissionStart)
  ) {
    return `Vote end can't be after "${nextContest.name}"'s submissions open.`;
  }
  return null;
};

exports.getDefaultSchedule = async ({ query: { date, excludeId } }, res) => {
  const dateError = getDateFormatError(date);
  if (dateError) {
    res.status(400).send(dateError);
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
    if (contest.yearEnd) {
      res.status(400).send(YEAR_END_MESSAGE);
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
    categories, date, name, prompt,
  } = body;

  const dateError = getDateFormatError(date);
  if (dateError) {
    res.status(400).send(dateError);
    return;
  }
  if (!isValidCategories(categories)) {
    res.status(400).send('Categories must be a list of names.');
    return;
  }
  const textFieldError = getTextFieldError({ name, prompt });
  if (textFieldError) {
    res.status(400).send(textFieldError);
    return;
  }

  // Missing timestamps fall back to the default schedule, so validate the merged result
  // rather than only the ones provided.
  const defaults = getDefaultContestDates(date);
  const submissionStart = body.submissionStart || defaults.submissionStart;
  const submissionEnd = body.submissionEnd || defaults.submissionEnd;
  const voteStart = body.voteStart || defaults.voteStart;
  const voteEnd = body.voteEnd || defaults.voteEnd;

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

    const [previousContest, nextContest] = await Promise.all([
      getPreviousContest(date),
      getNextContest(date),
    ]);
    const overlapError = getOverlapError({
      submissionStart,
      voteEnd,
      previousContest,
      nextContest,
    });
    if (overlapError) {
      res.status(400).send(overlapError);
      return;
    }

    await addContest({
      categories: categories && normalizeCategories(categories),
      date,
      name: name.trim(),
      prompt: prompt.trim(),
      submissionEnd,
      submissionStart,
      voteEnd,
      voteStart,
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
    categories,
    date,
    name,
    prompt,
    submissionEnd,
    submissionStart,
    voteEnd,
    voteStart,
  } = body;

  const dateError = getDateFormatError(date);
  if (dateError) {
    res.status(400).send(dateError);
    return;
  }
  if (!isValidCategories(categories)) {
    res.status(400).send('Categories must be a list of names.');
    return;
  }
  const textFieldError = getTextFieldError({ name, prompt });
  if (textFieldError) {
    res.status(400).send(textFieldError);
    return;
  }

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
    });
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
    if (contest.yearEnd) {
      res.status(400).send(YEAR_END_MESSAGE);
      return;
    }
    // Only a move to another month has to land in the present or future, so a contest
    // still awaiting certification after its month ends can have its name or prompt fixed.
    const monthChanged = date !== contest.date.toJSON().substr(0, 10);
    const pastMonthError = monthChanged && getPastMonthError(date);
    if (pastMonthError) {
      res.status(400).send(pastMonthError);
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

    const [previousContest, nextContest] = await Promise.all([
      getPreviousContest(date, id),
      getNextContest(date, id),
    ]);
    const overlapError = getOverlapError({
      submissionStart,
      voteEnd,
      previousContest,
      nextContest,
    });
    if (overlapError) {
      res.status(400).send(overlapError);
      return;
    }

    // Validate the category changes before writing anything, so a rejected edit doesn't
    // leave the contest half-updated.
    const existingCategories = await getCategories(id);
    // Leaving categories out of the body keeps the current ones.
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

    // A contest's id follows its month (e.g. nov26), so it can only move while nothing
    // references the id yet.
    let newId = id;
    if (monthChanged && !(await isUpcoming(contest))) {
      res
        .status(400)
        .send(
          "Can't move a contest to another month once its submissions have opened.",
        );
      return;
    }
    const computedId = getContestId(date);
    if (monthChanged && computedId !== id) {
      if (await getContestById(computedId)) {
        res
          .status(400)
          .send(
            `Can't move this contest: the id "${computedId}" is already taken.`,
          );
        return;
      }
      newId = computedId;
    }

    const updatedContest = await updateContest({
      id,
      newId,
      name: name.trim(),
      date,
      prompt: prompt.trim(),
      submissionStart,
      submissionEnd,
      voteStart,
      voteEnd,
      categoriesToAdd,
      categoriesToRemove,
    });

    res.send(updatedContest);
  } catch (err) {
    logger.error(`Error putting /mod/contests/${id}: ${err.message || err}`);
    res.status(500).send('Failed to update contest');
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
    if (contest.yearEnd) {
      res.status(400).send(YEAR_END_MESSAGE);
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
    res.status(500).send('Failed to delete contest');
  }
};
