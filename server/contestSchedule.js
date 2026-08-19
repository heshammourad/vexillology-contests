/**
 * Default contest scheduling rules, derived from the actual dates used by
 * past contests. Regular months run an 18-day submission window followed by
 * an 8-day voting window (1st -> 19th -> 27th); December runs a shorter
 * cycle (1st -> 17th -> 22nd) to leave room for the Best of Year contest.
 *
 * @exports getContestId
 * @exports getDefaultContestDates
 * @exports getMonthBounds
 * @exports getMonthRangeError
 * @exports getPastMonthError
 * @exports getScheduleOrderError
 */

const { zonedTimeToUtc } = require('date-fns-tz');

const TIME_ZONE = 'America/New_York';

const MONTH_ABBREVIATIONS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const STANDARD_SUBMISSION_DAYS = 18;
const STANDARD_VOTE_DAYS = 26;
const DECEMBER_SUBMISSION_DAYS = 16;
const DECEMBER_VOTE_DAYS = 21;

/**
 * Parses a 'YYYY-MM-DD' string (or Date) into { year, month, day }, where
 * month is 1-indexed. Reading the pieces this way (rather than through
 * Date getters) keeps the result independent of the host's system timezone.
 */
const parseDateParts = (date) => {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    return { year, month, day };
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const addDays = ({ year, month, day }, days) => {
  const utcMs = Date.UTC(year, month - 1, day) + days * 24 * 60 * 60 * 1000;
  const result = new Date(utcMs);
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
};

const toMidnightEastern = ({ year, month, day }) => {
  const pad = (n) => String(n).padStart(2, '0');
  return zonedTimeToUtc(
    `${year}-${pad(month)}-${pad(day)} 00:00:00`,
    TIME_ZONE,
  );
};

exports.getContestId = (date) => {
  const { year, month } = parseDateParts(date);
  return `${MONTH_ABBREVIATIONS[month - 1]}${String(year).slice(-2)}`;
};

exports.getDefaultContestDates = (date) => {
  const dateParts = parseDateParts(date);
  const isDecember = dateParts.month === 12;
  const submissionDays = isDecember
    ? DECEMBER_SUBMISSION_DAYS
    : STANDARD_SUBMISSION_DAYS;
  const voteDays = isDecember ? DECEMBER_VOTE_DAYS : STANDARD_VOTE_DAYS;

  const submissionStart = toMidnightEastern(dateParts);
  const submissionEnd = toMidnightEastern(addDays(dateParts, submissionDays));
  const voteStart = submissionEnd;
  const voteEnd = toMidnightEastern(addDays(dateParts, voteDays));

  return {
    submissionStart,
    submissionEnd,
    voteStart,
    voteEnd,
  };
};

/**
 * Checks that a contest's submission/vote windows are in a sensible chronological order.
 * Fields that aren't provided are skipped rather than treated as an error, since callers
 * (e.g. partial updates) may only be setting some of the four.
 *
 * @param {Object} dates
 * @returns {string|null} An error message, or null if the order is fine.
 */
exports.getScheduleOrderError = ({
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
}) => {
  const start = submissionStart && new Date(submissionStart);
  const end = submissionEnd && new Date(submissionEnd);
  const voteStartDate = voteStart && new Date(voteStart);
  const voteEndDate = voteEnd && new Date(voteEnd);

  if (start && end && start >= end) {
    return 'Submission end must be after submission start.';
  }
  if (end && voteStartDate && voteStartDate < end) {
    return 'Vote start cannot be before submission end.';
  }
  if (voteStartDate && voteEndDate && voteStartDate >= voteEndDate) {
    return 'Vote end must be after vote start.';
  }
  return null;
};

/**
 * Returns the ET-midnight instants bounding a contest's month: monthStart is midnight on
 * the 1st of the given month, monthEnd is midnight on the 1st of the following month
 * (an exclusive upper bound).
 *
 * @param {string} date
 * @returns {{ monthStart: Date, monthEnd: Date }}
 */
exports.getMonthBounds = (date) => {
  const dateParts = parseDateParts(date);
  const monthStart = toMidnightEastern(dateParts);
  const nextMonthParts = dateParts.month === 12
    ? { year: dateParts.year + 1, month: 1, day: 1 }
    : { year: dateParts.year, month: dateParts.month + 1, day: 1 };
  const monthEnd = toMidnightEastern(nextMonthParts);
  return { monthStart, monthEnd };
};

/**
 * Checks that a contest's submission end and vote window fall within its own month (ET).
 * Submission start is intentionally not checked - it's normal for submissions to open
 * before the month starts. Fields that aren't provided are skipped.
 *
 * @param {Object} params
 * @returns {string|null} An error message, or null if everything provided is in range.
 */
exports.getMonthRangeError = ({
  date, submissionEnd, voteStart, voteEnd,
}) => {
  const { monthStart, monthEnd } = exports.getMonthBounds(date);
  const isInRange = (value) => value >= monthStart && value < monthEnd;

  if (submissionEnd && !isInRange(new Date(submissionEnd))) {
    return 'Submission end must fall within the selected month.';
  }
  if (voteStart && !isInRange(new Date(voteStart))) {
    return 'Vote start must fall within the selected month.';
  }
  if (voteEnd && !isInRange(new Date(voteEnd))) {
    return 'Vote end must fall within the selected month.';
  }
  return null;
};

/**
 * Checks that a contest's month isn't already in the past. A coarse year/month comparison
 * against the current date - not worth being ET-precise for a "not 20 years ago" sanity check.
 *
 * @param {string} date
 * @returns {string|null} An error message, or null if the month is current or upcoming.
 */
exports.getPastMonthError = (date) => {
  const { year, month } = parseDateParts(date);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Contest month cannot be in the past.';
  }
  return null;
};
