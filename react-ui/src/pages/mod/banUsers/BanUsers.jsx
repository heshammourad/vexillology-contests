/*
Pre-fill contestId based on most likely?
*/

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useEffect, useMemo, useState } from 'react';

import { ProtectedRoute, ContestSelector } from '../../../components';
import useSwrContests from '../../../data/useSwrContests';
import SectionTitleWithButtons from '../analyzeVotes/SectionTitleWithButtons';
import { SEARCH_RESULTS, UserBanHistory } from '../viewBans/ViewBans';

import {
  ActionSelectorForMultipleUsers,
  ActionSelectorForOneUser,
} from './ActionSelectors';
import BanLength from './BanLength';
import EditTypeSelector from './EditTypeSelector';

const {
  format, addMonths, endOfMonth, differenceInMonths,
} = require('date-fns');

const DEV_OPTIONS = {
  createNew: 'createNew',
  editBan: 'editBan',
  editWarning: 'editWarning',
  fromContest: 'fromContest',
};

const DEV_OPTION = DEV_OPTIONS.editBan;

const useRefreshOnDevOptionChange = () => {
  useEffect(() => {
    const STORAGE_KEY = 'last_dev_option';
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (storedValue !== DEV_OPTION) {
      // Update stored value to prevent infinite reloads
      localStorage.setItem(STORAGE_KEY, DEV_OPTION);
      window.location.reload();
    }
  }, []);
};

const USER_BAN_QUERY_RESULT = SEARCH_RESULTS[0];

const getActionId = () => {
  if (DEV_OPTION === DEV_OPTIONS.editBan) {
    return 'as1';
  }
  if (DEV_OPTION === DEV_OPTIONS.editWarning) {
    return 'as4';
  }
  return null;
};

const SEARCH_PARAMS = {
  contestId: DEV_OPTION === DEV_OPTIONS.fromContest ? 'sep23' : null,
  usernames:
    DEV_OPTION === DEV_OPTIONS.fromContest ? ['joshuauiux', 'WorkingKing'] : [],
  actionId: getActionId(),
};

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
 * The page for moderators to create / edit a ban / warning
 */
function BanUsers() {
  // FOR DEV PURPOSES ONLY
  useRefreshOnDevOptionChange();

  const classes = useStyles();

  const { actionId, contestId, usernames } = SEARCH_PARAMS;

  // HELPER VARIABLES
  const action = USER_BAN_QUERY_RESULT.history.find(
    (a) => a.actionId === actionId,
  );
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
  const initialMonths = action?.endDate !== null
    ? differenceInMonths(action.endDate, action.startDate)
    : 1;
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
          || (isEditAction && editType === 'edit' && action.lifted))
        && 'lifting';

  const sectionHeader = useMemo(() => {
    if (isFromContest) {
      const numUsers = SEARCH_PARAMS.usernames.length === 1
        ? '1 user'
        : `${SEARCH_PARAMS.usernames.length} users`;
      return `Take action against ${numUsers}`;
    }
    if (isNewAction) {
      return 'Ban / warn user';
    }
    return `Edit ${isBan ? 'ban' : 'warning'}`;
  }, [isFromContest, isNewAction, isBan]);

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
              username={USER_BAN_QUERY_RESULT.username}
              history={USER_BAN_QUERY_RESULT.history}
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
          contestId={isLockedEdit ? action.contestId : selectedContestId}
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
          value={isLockedEdit ? action.reason : reason}
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
