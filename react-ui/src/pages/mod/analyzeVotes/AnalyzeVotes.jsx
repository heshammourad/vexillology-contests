import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import {Outlet, useNavigate, useLocation} from 'react-router-dom';

import {ContestSelector, ProtectedRoute} from '../../../components';
import useContestId from '../../../data/useContestId';

import {ChipProvider} from './ChipContext';

const useStyles = makeStyles({
  sectionHeader: {
    maxWidth: 'fit-content',
    borderBottom: '1px solid #000',
    fontWeight: 'lighter',
  },
});

/**
 * The page for moderators to review entrants and voters
 */
function AnalyzeVotes() {
  const classes = useStyles();
  const contestId = useContestId();
  const error = {};
  // const contest = useMemo(
  //   () => contests.find((c) => c.id === contestId),
  //   [contests, contestId],
  // );
  const navigate = useNavigate();
  const location = useLocation();
  const handleContestSelection = (cId) => {
    const currentPath = location.pathname;
    const isVotersRoute = currentPath.endsWith('/voters');
    const targetPath = isVotersRoute ? `./${cId}/voters` : `./${cId}`;
    navigate(targetPath);
  };

  return (
    <ProtectedRoute errorStatus={error?.response?.status}>
      <br />
      <br />
      <br />
      <h1 className={classes.sectionHeader}>Analyze votes</h1>

      <Box display="flex" sx={{alignItems: 'center'}}>
        <Typography>
          <b>Contest</b>
        </Typography>
        <Button
          color="secondary"
          variant="outlined"
          size="small"
          style={{marginLeft: 10}}
          disabled={!contestId}
          onClick={() =>
            window.open(
              `/contests/${contestId}`,
              '_blank',
              'noopener,noreferrer',
            )
          }>
          OPEN CONTEST IN NEW TAB
        </Button>
      </Box>

      <ContestSelector
        contestId={contestId}
        onChange={handleContestSelection}
      />

      <br />

      <ChipProvider>
        <Outlet />
      </ChipProvider>
    </ProtectedRoute>
  );
}

export default AnalyzeVotes;
