import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import MessageIcon from '@material-ui/icons/Message';
import Alert from '@material-ui/lab/Alert';
import countBy from 'lodash/countBy';
import { useEffect, useState } from 'react';

import {
  CustomIconButton,
  ProtectedRoute,
  SubmissionsTable,
} from '../../../components';
import useSwrModReview from '../../../data/useSwrModReview';

import StatusFilters from './StatusFilters';

const useStyles = makeStyles((theme) => ({
  header: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  messageIcon: {
    marginLeft: theme.spacing(1),
  },
  submissionsError: {
    marginBottom: theme.spacing(2),
  },
}));

/**
 * The page for moderators to review contest submissions.
 */
function ReviewSubmissions() {
  const {
    data: { name: contestName, submissions = [], userBreakdown = {} },
    error,
  } = useSwrModReview();
  const [selectedChips, setSelectedChips] = useState({});
  const [selectedUsers, setSelectedUsers] = useState({});
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);

  const submissionStatusCounts = countBy(submissions, 'submissionStatus');
  const usersExceedingLimit = Object.entries(userBreakdown).filter(
    (breakdown) => breakdown[1].approved > 2,
  );

  useEffect(() => {
    let updatedSubmissions = [...submissions];

    const statusesToDisplay = Object.keys(selectedChips).filter(
      (status) => selectedChips[status],
    );
    if (statusesToDisplay.length) {
      // eslint-disable-next-line max-len
      updatedSubmissions = updatedSubmissions.filter(({ submissionStatus }) => statusesToDisplay.includes(submissionStatus));
    }

    const usersToDisplay = Object.keys(selectedUsers).filter(
      (user) => selectedUsers[user],
    );
    if (usersToDisplay.length) {
      updatedSubmissions = updatedSubmissions.filter(({ user }) => usersToDisplay.includes(user));
    }

    setFilteredSubmissions(updatedSubmissions);
  }, [selectedChips, selectedUsers, submissions]);

  useEffect(() => {
    setSelectedChips({ approved: showErrorsOnly });
    setSelectedUsers(
      showErrorsOnly
        ? usersExceedingLimit.reduce((acc, [user]) => {
          acc[user] = true;
          return acc;
        }, {})
        : {},
    );
  }, [showErrorsOnly]);

  const handleChipClick = (chipName) => () => {
    setSelectedChips({
      ...selectedChips,
      [chipName]: !selectedChips[chipName],
    });
  };

  const toggleErrorFilters = () => {
    setShowErrorsOnly(!showErrorsOnly);
  };

  const resetFilters = () => {
    setSelectedChips({});
  };

  const generateMessageUrl = (user) => {
    const entries = submissions.filter(
      (submission) => submission.submissionStatus === 'approved' && submission.user === user,
    );
    const message = entries.reduce(
      (acc, { imagePath, name }) => {
        const response = `${acc}\n- [${name}](https://www.vexillologycontests.com${imagePath})  `;
        return response;
      },
      `
Hello ${user},

You have more than 2 entries in this month's contest. Can you please let us know which 2 you would like to keep?
`,
    );
    const url = `https://reddit.com/message/compose?to=${user}&subject=${encodeURIComponent(
      'Extra Submissions',
    )}&message=${encodeURIComponent(message)}`;
    return url;
  };

  const classes = useStyles();
  return (
    <ProtectedRoute errorStatus={error?.response?.status}>
      <Typography className={classes.header} component="h1" variant="h5">
        {contestName}
      </Typography>
      {submissions?.length ? (
        <>
          <StatusFilters
            disabled={showErrorsOnly}
            onChipClick={handleChipClick}
            selectedChips={selectedChips}
            submissionStatusCounts={submissionStatusCounts}
          />
          {usersExceedingLimit.length > 0 && (
            <Alert className={classes.submissionsError} severity="error">
              The following users have more than 2 approved entries:
              <ul>
                {usersExceedingLimit.map(([user, { approved }]) => (
                  <li key={user}>
                    <span>{`/u/${user}: ${approved} entries`}</span>
                    <CustomIconButton
                      ariaLabel={`Send message to ${user}`}
                      className={classes.messageIcon}
                      color="primary"
                      href={generateMessageUrl(user)}
                      Icon={MessageIcon}
                      size="small"
                    />
                  </li>
                ))}
              </ul>
              <Button
                color="primary"
                onClick={toggleErrorFilters}
                variant="contained"
              >
                {showErrorsOnly ? 'Reset Filters' : 'Show Errors'}
              </Button>
            </Alert>
          )}
          {filteredSubmissions
            && (filteredSubmissions.length ? (
              <SubmissionsTable
                moderator
                submissions={filteredSubmissions}
                userBreakdown={userBreakdown}
              />
            ) : (
              <>
                <Typography component="div" variant="subtitle2">
                  There are no entries matching the filter.
                </Typography>
                <Button color="primary" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </>
            ))}
        </>
      ) : (
        contestName && (
          <Box display="flex" alignItems="center" justifyContent="center">
            <Typography component="div" variant="h6">
              There are no submissions for this contest
            </Typography>
          </Box>
        )
      )}
    </ProtectedRoute>
  );
}

export default ReviewSubmissions;
