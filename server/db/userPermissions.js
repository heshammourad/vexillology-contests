/**
 * Enum for user permissions.
 * @readonly
 * @enum {string}
 */
const UserPermissions = Object.freeze({
  ACCESS_FAIRNESS_TOOLS: 'access_fairness_tools',
  DISQUALIFY_ENTRIES: 'disqualify_entries',
  REVIEW_SUBMISSIONS: 'review_submissions',
  PARTICIPATE_IN_CONTEST: 'participate_in_contest',
  VIEW_SCORES: 'view_scores',
});

module.exports = UserPermissions;
