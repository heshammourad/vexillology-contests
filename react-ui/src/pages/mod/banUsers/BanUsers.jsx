/*
Pre-fill contestId based on most likely?
*/

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ProtectedRoute, ContestSelector } from '../../../components';
import { postData } from '../../../data/api';
import useSwrAuth from '../../../data/useSwrAuth';
import useSwrContests from '../../../data/useSwrContests';
import useSwrMutation from '../../../data/useSwrMutation';
import SectionTitleWithButtons from '../analyzeVotes/SectionTitleWithButtons';
import { UserBanHistory } from '../viewBans/ViewBans';

import {
  ActionSelectorForMultipleUsers,
  ActionSelectorForOneUser,
} from './ActionSelectors';
import BanLength from './BanLength';
import EditTypeSelector from './EditTypeSelector';

const {
  format, addMonths, endOfMonth, differenceInMonths,
} = require('date-fns');

const useStyles = makeStyles({
  italics: {
    fontStyle: 'italic',
  },
  sectionHeader: {
    maxWidth: 'fit-content',
    borderBottom: '1px solid #000',
    fontWeight: 'lighter',
  },
  selector: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
  },
});

function formatDate(date) {
  if (!(date instanceof Date)) {
    return null;
  }
  return format(date, 'MMM d, yyyy');
}

/**
 * Reusable error page component
 */
function ErrorPage({
  title,
  message,
  buttonText = 'Back to Search',
  onButtonClick,
}) {
  const navigate = useNavigate();
  const handleClick = onButtonClick || (() => navigate('/mod/viewBans'));

  return (
    <ProtectedRoute>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        textAlign="center"
        padding={3}
      >
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {message}
        </Typography>
        {buttonText && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleClick}
            size="large"
          >
            {buttonText}
          </Button>
        )}
      </Box>
    </ProtectedRoute>
  );
}

ErrorPage.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  onButtonClick: PropTypes.func,
};

ErrorPage.defaultProps = {
  buttonText: 'Back to Search',
  onButtonClick: null,
};

/**
 * The page for moderators to create / edit a ban / warning
 */
function BanUsers() {
  const classes = useStyles();
  const location = useLocation();

  // Parse URL search parameters
  const searchParams = new URLSearchParams(location.search);
  const actionId = searchParams.get('a');
  const contestId = searchParams.get('c');
  const usernamesParam = searchParams.get('u');
  const usernames = usernamesParam ? usernamesParam.split(',') : [];

  // Check if we have a username for individual user actions
  const hasUsername = actionId || usernames.length > 0;

  // Fetch ban history for usernames
  const {
    data: userData,
    error: userError,
    isLoading,
  } = useSwrAuth(
    usernames.length > 0
      ? `/mod/userBanHistory?usernames=${usernames.join(',')}`
      : null,
  );

  // Form submission mutation
  const { isMutating, trigger } = useSwrMutation('/mod/saveUserBan', postData);

  // Get the first user for single user actions (when actionId is provided)
  const firstUser = userData?.users?.[0];
  const userHistory = firstUser?.history || [];

  // HELPER VARIABLES
  const action = userHistory.find((a) => a.actionId === actionId);
  const isNewAction = !actionId;
  const isEditAction = !!actionId;
  const isFromContest = !!contestId;

  // ACTION TYPE STATE
  const [isBan, setIsBan] = useState(
    isNewAction || action?.actionType === 'ban',
  );
  const [dqVoters, setDqVoters] = useState(new Set());
  const [removeEntrants, setRemoveEntrants] = useState(new Set());
  const [warnUsers, setWarnUsers] = useState(new Set());
  const [banUsers, setBanUsers] = useState(new Set());

  // EDIT TYPE STATE
  const [editType, setEditType] = useState('edit');
  const isEdit = editType === 'edit';
  const isLockedEdit = editType !== 'edit';

  // CONTEST / START DATE STATE
  const initialContestId = action?.contestId || contestId;
  const [selectedContestId, setSelectedContestId] = useState(initialContestId);
  const { data: contests } = useSwrContests();
  const selectedContest = contests.find((c) => c.id === selectedContestId);
  const startDate = selectedContest
    && addMonths(new Date(...selectedContest.date.split('-')), -1);

  // BAN LENGTH / END DATE STATE
  // MUST CALCULATE MONTHS FROM ACTION
  const initialMonths = (() => {
    if (action?.endDate === null) {
      return 1; // Permanent ban
    }
    if (
      action?.endDate
      && action?.startDate
      && action.endDate instanceof Date
      && action.startDate instanceof Date
    ) {
      const months = differenceInMonths(action.endDate, action.startDate);
      return Number.isNaN(months) ? 1 : Math.max(1, months);
    }
    return 1; // Default to 1 month if dates are invalid
  })();
  const [months, setMonths] = useState(initialMonths);
  const initialIsPermanentBan = action?.endDate === null;
  const [isPermanentBan, setIsPermanentBan] = useState(initialIsPermanentBan);
  const endDate = startDate && endOfMonth(addMonths(startDate, months - 1));

  // REASONS
  const initialReason = action?.reason || '';
  const [reason, setReason] = useState(initialReason);
  const initialRemovalReason = action?.liftedReason || '';
  const [removalReason, setRemovalReason] = useState(
    action?.liftedReason || '',
  );
  const removalText = editType === 'pardon'
    ? 'pardon'
    : (editType === 'lift'
          || (isEditAction && editType === 'edit' && action?.lifted))
        && 'lifting';

  // Form submission state
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Validation function to check if all required fields are complete
  const isFormValid = useMemo(() => {
    // For contest-based actions (multiple users)
    if (isFromContest) {
      // At least one action must be selected
      const hasAnyAction = dqVoters.size > 0
        || removeEntrants.size > 0
        || warnUsers.size > 0
        || banUsers.size > 0;

      if (!hasAnyAction) {
        return false;
      }

      // If banning users, contest must be selected
      if (banUsers.size > 0 && !selectedContestId) {
        return false;
      }

      // If warning users, contest must be selected
      if (warnUsers.size > 0 && !selectedContestId) {
        return false;
      }

      // If banning users, reason is required
      if (banUsers.size > 0 && !reason.trim()) {
        return false;
      }

      // If warning users, reason is required
      if (warnUsers.size > 0 && !reason.trim()) {
        return false;
      }

      // If lifting/pardoning, removal reason is required
      if (removalText && !removalReason.trim()) {
        return false;
      }

      return true;
    }

    // For single user actions
    // Username must be present
    if (!firstUser?.username) {
      return false;
    }

    // Contest must be selected
    if (!selectedContestId) {
      return false;
    }

    // Reason is required
    if (!reason.trim()) {
      return false;
    }

    // If lifting/pardoning, removal reason is required
    if (removalText && !removalReason.trim()) {
      return false;
    }

    return true;
  }, [
    isFromContest,
    dqVoters.size,
    removeEntrants.size,
    warnUsers.size,
    banUsers.size,
    selectedContestId,
    reason,
    removalReason,
    removalText,
    firstUser?.username,
  ]);

  const sectionHeader = useMemo(() => {
    if (isFromContest) {
      const numUsers = usernames.length === 1 ? '1 user' : `${usernames.length} users`;
      return `Take action against ${numUsers}`;
    }
    if (isNewAction) {
      return 'Ban / warn user';
    }
    return `Edit ${isBan ? 'ban' : 'warning'}`;
  }, [isFromContest, isNewAction, isBan, usernames]);

  const navigate = useNavigate();

  // Reset form function
  const handleResetForm = () => {
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Form submission handler
  const handleSubmit = () => {
    if (!isFormValid || isMutating) {
      return;
    }

    setSubmitError(null);

    // For contest-based actions, we need to handle multiple users
    if (isFromContest) {
      // TODO: Implement multiple user submission logic
      setSubmitError('Multiple user submission not yet implemented');
      return;
    }

    // For single user actions
    const submitData = {
      actionId: actionId || null,
      username: firstUser.username,
      contestId: selectedContestId,
      actionType: isBan ? 'ban' : 'warn',
      startDate: startDate?.toISOString(),
      endDate: isPermanentBan ? null : endDate?.toISOString(),
      reason: reason.trim(),
      editType: isEditAction ? editType : null,
      removalReason: removalText ? removalReason.trim() : null,
    };

    trigger(submitData, {
      onSuccess: (response) => {
        if (response?.data?.success) {
          setSubmitSuccess(
            response.data.message || 'Ban/warning saved successfully',
          );
        } else {
          setSubmitError('Failed to save ban/warning. Please try again.');
        }
      },
      onError: (error) => {
        setSubmitError(
          error.response?.data?.error
            || 'An error occurred while saving. Please try again.',
        );
      },
    });
  };

  // Validation checks after all hooks are declared
  if (!hasUsername) {
    return (
      <ErrorPage
        title="No User Selected"
        message="You need to select a user to ban or warn. Please search for a user first."
      />
    );
  }

  // Check for loading state - useSwrAuth returns empty object {} during loading
  if (usernames.length > 0 && isLoading) {
    return (
      <ErrorPage
        title="Loading User Data..."
        message=""
        buttonText=""
        onButtonClick={() => {}}
      />
    );
  }

  if (userError || (userData && userData.error)) {
    return (
      <ErrorPage
        title="Error Loading User Data"
        message="Failed to load user information. Please try again."
      />
    );
  }

  // More specific check for invalid data format
  if (
    usernames.length > 0
    && userData
    && typeof userData === 'object'
    && !Array.isArray(userData.users)
  ) {
    return (
      <ErrorPage
        title="Invalid Data Format"
        message="Received invalid data format from server. Please try again."
      />
    );
  }

  if (
    usernames.length > 0
    && userData
    && (!userData.users || userData.users.length === 0)
  ) {
    return (
      <ErrorPage
        title="User Not Found"
        message="The specified user could not be found. Please check the username and try again."
      />
    );
  }

  if (actionId && !action) {
    return (
      <ErrorPage
        title="Action Not Found"
        message="The specified action could not be found. Please search for the user again."
      />
    );
  }

  // Show success page if submission was successful
  if (submitSuccess) {
    return (
      <ProtectedRoute>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
          textAlign="center"
          padding={3}
        >
          <Typography variant="h4" gutterBottom color="primary">
            Success!
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {submitSuccess}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/mod/viewBans')}
            >
              View All Bans
            </Button>
            <Button variant="outlined" onClick={handleResetForm}>
              Create Another
            </Button>
          </Box>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <br />
      <br />
      <br />

      <h1 className={classes.sectionHeader}>{sectionHeader}</h1>

      {isFromContest ? (
        <ActionSelectorForMultipleUsers
          {...{
            dqVoters,
            setDqVoters,
            removeEntrants,
            setRemoveEntrants,
            warnUsers,
            setWarnUsers,
            banUsers,
            setBanUsers,
            usernames,
          }}
        />
      ) : (
        <>
          <Box sx={{ backgroundColor: '#ddd', padding: '8px' }}>
            <UserBanHistory
              username={firstUser?.username}
              history={userHistory}
              actionId={actionId}
            />
          </Box>
          <br />
          <ActionSelectorForOneUser {...{ isBan, setIsBan, isNewAction }} />
        </>
      )}

      <Separator />

      {isEditAction && (
        <>
          <EditTypeSelector {...{ isBan, editType, setEditType }} />
          <Separator />
        </>
      )}

      <SectionTitleWithButtons
        title="Contest / start date"
        buttons={
          isEdit
            ? [
              {
                text: 'Reset',
                color: 'primary',
                onClick: () => setSelectedContestId(initialContestId),
                disabled:
                    !selectedContestId
                    || selectedContestId === initialContestId,
              },
            ]
            : []
        }
      />

      <Box sx={{ marginTop: 10 }}>
        <ContestSelector
          contestId={isLockedEdit ? action?.contestId : selectedContestId}
          onChange={setSelectedContestId}
          disabled={isFromContest || isLockedEdit}
        />
      </Box>

      {isBan && startDate && (
        <Box sx={{ marginTop: 10 }}>
          <Typography className={classes.italics}>
            {`Ban will be given a start date of ${formatDate(startDate)}`}
          </Typography>
        </Box>
      )}

      <Separator />

      {isBan && (
        <>
          <SectionTitleWithButtons
            title="Ban length / end date"
            buttons={
              isEdit
                ? [
                  {
                    text: 'Reset',
                    color: 'primary',
                    onClick: () => {
                      setMonths(initialMonths);
                      setIsPermanentBan(initialIsPermanentBan);
                    },
                    disabled:
                        (isPermanentBan && initialIsPermanentBan)
                        || months === initialMonths,
                  },
                ]
                : []
            }
          />
          <BanLength
            {...{
              months,
              setMonths,
              isPermanentBan,
              setIsPermanentBan,
              endDate,
            }}
            disabled={isLockedEdit}
          />
          <Separator />
        </>
      )}

      <SectionTitleWithButtons
        title={`${isBan ? 'Ban' : 'Warning'} reason`}
        buttons={
          isEdit
            ? [
              {
                text: 'Reset',
                color: 'primary',
                onClick: () => setReason(initialReason),
                disabled: reason === initialReason,
              },
            ]
            : []
        }
      />

      <Box sx={{ width: '100%', marginTop: 10 }}>
        <TextField
          id="reason"
          variant="outlined"
          multiline
          fullWidth
          value={isLockedEdit ? action?.reason : reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={isLockedEdit}
        />
      </Box>

      {!!removalText && (
        <>
          <Separator />
          <SectionTitleWithButtons
            title={`Reason for ${removalText}`}
            buttons={
              initialRemovalReason
                ? [
                  {
                    text: 'Reset',
                    color: 'primary',
                    onClick: () => setRemovalReason(initialRemovalReason),
                    disabled: removalReason === initialRemovalReason,
                  },
                ]
                : []
            }
          />

          <Box sx={{ width: '100%', marginTop: 10 }}>
            <TextField
              id="removalReason"
              variant="outlined"
              multiline
              fullWidth
              value={removalReason}
              onChange={(event) => setRemovalReason(event.target.value)}
            />
          </Box>
        </>
      )}

      <br />
      <br />

      {submitError && (
        <Box sx={{ marginBottom: 2 }}>
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', marginTop: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={!isFormValid || isMutating}
          onClick={handleSubmit}
        >
          {(() => {
            if (isMutating) {
              return 'Saving...';
            }
            if (isNewAction) {
              return 'Save';
            }
            return 'Edit';
          })()}
        </Button>
      </Box>

      <br />
    </ProtectedRoute>
  );
}

function Separator() {
  return (
    <>
      <br />
      <hr />
      <br />
    </>
  );
}

export default BanUsers;

BanUsers.propTypes = {
  // Add any necessary prop types here
};
