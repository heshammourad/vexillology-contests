import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useSwrData } from '../../common';
import {
  FilterChip,
  Header,
  PageContainer,
  ProtectedRoute,
  SubmissionsTable,
} from '../../components';

const API_PATH = '/mod/reviewSubmissions';

const useStyles = makeStyles((theme) => ({
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
    marginBottom: theme.spacing(2),
  },
  header: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

/**
 * The page for moderators to review contest submissions.
 */
function ReviewSubmissions() {
  const {
    data: { name: contestName, submissions, userBreakdown },
  } = useSwrData(API_PATH);
  const { state } = useLocation();
  const [selectedChips, setSelectedChips] = useState({});
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);

  useEffect(() => {
    const statusesToDisplay = Object.keys(selectedChips).filter((status) => selectedChips[status]);
    if (!statusesToDisplay.length) {
      setFilteredSubmissions(submissions);
      return;
    }
    setFilteredSubmissions(
      submissions.filter(({ submissionStatus }) => statusesToDisplay.includes(submissionStatus)),
    );
  }, [selectedChips, submissions]);

  const handleChipClick = (chipName) => () => {
    setSelectedChips({ ...selectedChips, [chipName]: !selectedChips[chipName] });
  };

  const resetFilters = () => {
    setSelectedChips({});
  };

  const classes = useStyles();
  return (
    <>
      <Header position="static" to={state?.back ?? '/home'}>
        Review Submissions
      </Header>
      <ProtectedRoute moderatorPath={API_PATH}>
        <PageContainer>
          <Typography className={classes.header} component="h1" variant="h5">
            {contestName}
          </Typography>
          {submissions?.length ? (
            <>
              <div className={classes.chipContainer}>
                <FilterChip
                  label="Pending"
                  onClick={handleChipClick('pending')}
                  selected={selectedChips.pending ?? false}
                />
                <FilterChip
                  label="Approved"
                  onClick={handleChipClick('approved')}
                  selected={selectedChips.approved ?? false}
                />
                <FilterChip
                  label="Rejected"
                  onClick={handleChipClick('rejected')}
                  selected={selectedChips.rejected ?? false}
                />
                <FilterChip
                  label="Withdrawn"
                  onClick={handleChipClick('withdrawn')}
                  selected={selectedChips.withdrawn ?? false}
                />
              </div>
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
        </PageContainer>
      </ProtectedRoute>
    </>
  );
}

export default ReviewSubmissions;
