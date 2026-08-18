/**
 * Default contest scheduling rules, derived from the actual dates used by
 * past contests. Regular months run an 18-day submission window followed by
 * an 8-day voting window (1st -> 19th -> 27th); December runs a shorter
 * cycle (1st -> 17th -> 22nd) to leave room for the Best of Year contest.
 *
 * @exports getContestId
 * @exports getDefaultContestDates
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
