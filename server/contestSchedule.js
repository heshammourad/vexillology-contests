/**
 * Default contest scheduling rules, derived from the actual dates used by
 * past contests. Regular months open submissions on the 1st, start voting on
 * the 19th and end it on the 27th; December ends earlier (17th, 22nd) to
 * leave room for the Best of Year contest. Every boundary is midnight ET.
 *
 * Contest dates are 'YYYY-MM-01' strings, always the 1st of the contest's month.
 *
 * @exports getContestId
 * @exports getDateFormatError
 * @exports getDefaultContestDates
 * @exports getMonthBounds
 * @exports getMonthRangeError
 * @exports getPastMonthError
 * @exports getScheduleOrderError
 */

const {
  addMonths,
  format,
  isBefore,
  isValid,
  parseISO,
  setDate,
  startOfMonth,
} = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');

const TIME_ZONE = 'America/New_York';

const VOTE_START_DAY = 19;
const VOTE_END_DAY = 27;
const DECEMBER_VOTE_START_DAY = 17;
const DECEMBER_VOTE_END_DAY = 22;

// Midnight ET at the start of the given calendar day. Only the day's local calendar fields
// are read, so the result doesn't depend on the server's own timezone.
const toEasternMidnight = (day) => zonedTimeToUtc(`${format(day, 'yyyy-MM-dd')}T00:00:00`, TIME_ZONE);

// Request bodies carry ISO strings, and defaults are Dates; missing values stay null.
const toDateOrNull = (value) => (value ? new Date(value) : null);

/**
 * Checks that a contest date is the 1st of a real month, as 'YYYY-MM-01'. Contests always
 * start on the 1st, and getContestForMonth matches on that exact date.
 *
 * @param {string} date
 * @returns {string|null} An error message, or null if the date is well-formed.
 */
exports.getDateFormatError = (date) => (typeof date === 'string' && /^\d{4}-(0[1-9]|1[0-2])-01$/.test(date)
  ? null
  : 'Contest date must be the first of a month, as YYYY-MM-01.');

/**
 * @param {string} date
 * @returns {string} The contest id for the date's month, e.g. 'nov26'.
 */
exports.getContestId = (date) => format(parseISO(date), 'MMMyy').toLowerCase();

exports.getDefaultContestDates = (date) => {
  const firstOfMonth = parseISO(date);
  const isDecember = firstOfMonth.getMonth() === 11;
  const voteStart = toEasternMidnight(
    setDate(
      firstOfMonth,
      isDecember ? DECEMBER_VOTE_START_DAY : VOTE_START_DAY,
    ),
  );

  return {
    submissionStart: toEasternMidnight(firstOfMonth),
    submissionEnd: voteStart,
    voteStart,
    voteEnd: toEasternMidnight(
      setDate(firstOfMonth, isDecember ? DECEMBER_VOTE_END_DAY : VOTE_END_DAY),
    ),
  };
};

/**
 * Checks that a contest's submission/vote windows are in a sensible chronological order,
 * and that every one provided is a valid date. Fields that aren't provided are skipped.
 *
 * @param {Object} schedule
 * @returns {string|null} An error message, or null if the order is fine.
 */
exports.getScheduleOrderError = (schedule) => {
  const submissionStart = toDateOrNull(schedule.submissionStart);
  const submissionEnd = toDateOrNull(schedule.submissionEnd);
  const voteStart = toDateOrNull(schedule.voteStart);
  const voteEnd = toDateOrNull(schedule.voteEnd);

  // An invalid date makes every comparison below false, so catch it here rather than
  // letting it reach the database.
  if (
    [submissionStart, submissionEnd, voteStart, voteEnd].some(
      (d) => d && !isValid(d),
    )
  ) {
    return 'Submission and vote times must be valid dates.';
  }
  if (
    submissionStart
    && submissionEnd
    && !isBefore(submissionStart, submissionEnd)
  ) {
    return 'Submission end must be after submission start.';
  }
  if (submissionEnd && voteStart && isBefore(voteStart, submissionEnd)) {
    return 'Vote start cannot be before submission end.';
  }
  if (voteStart && voteEnd && !isBefore(voteStart, voteEnd)) {
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
  const firstOfMonth = parseISO(date);
  return {
    monthStart: toEasternMidnight(firstOfMonth),
    monthEnd: toEasternMidnight(addMonths(firstOfMonth, 1)),
  };
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
  const isInMonth = (value) => !isBefore(value, monthStart) && isBefore(value, monthEnd);

  if (submissionEnd && !isInMonth(new Date(submissionEnd))) {
    return 'Submission end must fall within the selected month.';
  }
  if (voteStart && !isInMonth(new Date(voteStart))) {
    return 'Vote start must fall within the selected month.';
  }
  if (voteEnd && !isInMonth(new Date(voteEnd))) {
    return 'Vote end must fall within the selected month.';
  }
  return null;
};

/**
 * Checks that a contest's month isn't already in the past. Compared in the server's
 * timezone - not worth being ET-precise for a "not 20 years ago" sanity check.
 *
 * @param {string} date
 * @returns {string|null} An error message, or null if the month is current or upcoming.
 */
exports.getPastMonthError = (date) => (isBefore(parseISO(date), startOfMonth(new Date()))
  ? 'Contest month cannot be in the past.'
  : null);
