/**
 * Pure helpers for the contest form. Months are 'YYYY-MM' strings (the month input's value);
 * a contest's date is always the 1st of its month.
 */

import addMonths from 'date-fns/addMonths';
import format from 'date-fns/format';
import getDate from 'date-fns/getDate';
import isAfter from 'date-fns/isAfter';
import isBefore from 'date-fns/isBefore';
import parseISO from 'date-fns/parseISO';
import startOfMonth from 'date-fns/startOfMonth';

const MONTH_FORMAT = 'yyyy-MM';
// The value format of a datetime-local input.
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

// Past this day of the month, a new contest defaults to next month instead of this one.
const LAST_DAY_TO_DEFAULT_TO_CURRENT_MONTH = 7;

export const getContestDate = (month) => `${month}-01`;

export const getCurrentMonth = () => format(new Date(), MONTH_FORMAT);

export const getDefaultMonth = () => {
  const today = new Date();
  return format(
    getDate(today) > LAST_DAY_TO_DEFAULT_TO_CURRENT_MONTH
      ? addMonths(today, 1)
      : today,
    MONTH_FORMAT,
  );
};

export const getMonthLabel = (month) => (month ? format(parseISO(getContestDate(month)), 'MMMM yyyy') : '');

export const getPastMonthError = (month) => {
  const isPast = month
    && isBefore(parseISO(getContestDate(month)), startOfMonth(new Date()));
  return isPast ? 'Contest month cannot be in the past.' : null;
};

// Converts a server timestamp into the browser-local value a datetime-local input expects.
export const toDatetimeLocalValue = (timestamp) => (timestamp ? format(new Date(timestamp), DATETIME_LOCAL_FORMAT) : '');

// Inverse of toDatetimeLocalValue. A datetime-local value has no timezone, so sending it as-is
// would let the database reinterpret it in its own timezone; an ISO string keeps what the
// moderator sees as what gets stored.
export const toIsoString = (datetimeLocalValue) => (datetimeLocalValue ? parseISO(datetimeLocalValue).toISOString() : '');

/**
 * Checks that the submission/vote windows are in order and, once the month's bounds are
 * known, that submission end and the vote window fall within the month (ET). Submission
 * start may open before the month, but not before the previous contest's voting ends, and
 * voting must end before the next contest's submissions open. Mirrors the server's checks.
 *
 * @param {Object} schedule - datetime-local values for the four fields.
 * @param {Object} monthSchedule - The /mod/contestSchedule response for the month.
 * @returns {Object} A map of field name to error message.
 */
export const getScheduleErrors = (schedule, monthSchedule) => {
  const toDate = (value) => (value ? new Date(value) : null);
  const submissionStart = toDate(schedule.submissionStart);
  const submissionEnd = toDate(schedule.submissionEnd);
  const voteStart = toDate(schedule.voteStart);
  const voteEnd = toDate(schedule.voteEnd);
  const monthStart = toDate(monthSchedule.monthStart);
  const monthEnd = toDate(monthSchedule.monthEnd);
  const previousVoteEnd = toDate(monthSchedule.previousContestVoteEnd);
  const nextSubmissionStart = toDate(monthSchedule.nextContestSubmissionStart);
  const isInMonth = (value) => !monthStart
    || !monthEnd
    || (!isBefore(value, monthStart) && isBefore(value, monthEnd));

  const errors = {};
  if (
    submissionStart
    && previousVoteEnd
    && isBefore(submissionStart, previousVoteEnd)
  ) {
    errors.submissionStart = `Can't be before "${monthSchedule.previousContestName}"'s voting window ends.`;
  }

  if (
    submissionStart
    && submissionEnd
    && !isBefore(submissionStart, submissionEnd)
  ) {
    errors.submissionEnd = 'Must be after submission start.';
  } else if (submissionEnd && !isInMonth(submissionEnd)) {
    errors.submissionEnd = 'Must fall within the selected month.';
  }

  if (submissionEnd && voteStart && isBefore(voteStart, submissionEnd)) {
    errors.voteStart = 'Must not be before submission end.';
  } else if (voteStart && !isInMonth(voteStart)) {
    errors.voteStart = 'Must fall within the selected month.';
  }

  if (voteStart && voteEnd && !isBefore(voteStart, voteEnd)) {
    errors.voteEnd = 'Must be after vote start.';
  } else if (voteEnd && !isInMonth(voteEnd)) {
    errors.voteEnd = 'Must fall within the selected month.';
  } else if (
    voteEnd
    && nextSubmissionStart
    && isAfter(voteEnd, nextSubmissionStart)
  ) {
    errors.voteEnd = `Can't be after "${monthSchedule.nextContestName}"'s submissions open.`;
  }

  return errors;
};

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g;
const SUBMISSION_URL_PATTERN = /vexillologycontests\.com\/submission\b|(?:^|["'(\s])\/submission\b/i;
// The imgur post the rules are usually linked to (lm0yPy7), plus our own rules page - matched
// by URL rather than link text, since a prompt could plausibly mention "rules" for other reasons.
const RULES_URL_PATTERN = /imgur\.com\/(?:a\/)?lm0yPy7\b|\/submission\/rules\b/i;

/**
 * Reddit-authored prompts are often pasted in with links the submission page already shows
 * below the prompt (the rules, and links back to the submission page itself). Flags those so
 * a moderator doesn't show them twice.
 *
 * @param {string} prompt
 * @returns {string[]} Descriptions of the duplicated links found, if any.
 */
export const getDuplicateLinkWarnings = (prompt) => {
  const urls = Array.from(
    prompt.matchAll(MARKDOWN_LINK_PATTERN),
    ([, , url]) => url,
  );
  const warnings = [];
  if (urls.some((url) => RULES_URL_PATTERN.test(url))) {
    warnings.push('a link to the contest rules');
  }
  if (urls.some((url) => SUBMISSION_URL_PATTERN.test(url))) {
    warnings.push('a link to the submission page');
  }
  return warnings;
};
