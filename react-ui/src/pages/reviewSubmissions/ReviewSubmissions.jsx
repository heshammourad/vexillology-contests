import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useSwrData } from '../../common';
import {
  FilterChip, Header, PageContainer, ProtectedRoute,
} from '../../components';

import Row from './Row';

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
    lineHeight: '64px',
  },
}));

function ReviewSubmissions() {
  const [
    {
      data: { name: contestName, submissions },
    },
  ] = useSwrData(API_PATH);
  const { state } = useLocation();
  const [selectedChips, setSelectedChips] = useState({});

  const handleChipClick = (chipName) => () => {
    setSelectedChips({ ...selectedChips, [chipName]: !selectedChips[chipName] });
  };

  const classes = useStyles();
  return (
    <>
      <Header position="static" to={state?.back ?? '/home'}>
        Review Submissions
      </Header>
      <PageContainer>
        <ProtectedRoute moderatorPath={API_PATH}>
          <PageContainer>
            <Typography className={classes.header} component="h1" variant="h5">
              {contestName}
            </Typography>
            {submissions.length ? (
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
                </div>
                <TableContainer component={Paper}>
                  <Table aria-label="submissions">
                    <TableBody>
                      {submissions.map(({ id, ...submission }) => (
                        <Row key={id} submission={submission} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography component="div" variant="h6">
                  There are no submissions for this contest
                </Typography>
              </Box>
            )}
          </PageContainer>
        </ProtectedRoute>
      </PageContainer>
    </>
  );
}

export default ReviewSubmissions;
