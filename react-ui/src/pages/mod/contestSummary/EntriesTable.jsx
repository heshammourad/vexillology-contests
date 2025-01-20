import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

import types from '../../../common/types';
// eslint-disable-next-line no-restricted-imports
import Submission from '../../../components/Submission';

const TableCellVerticalDividers = styled(TableCell)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
}));

function EntriesTable({ categories, entries }) {
  if (!entries?.length) {
    return null;
  }

  const hasCategories = categories.length > 0;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 667 }}>
      <Table aria-label="entries" stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCellVerticalDividers>Rank</TableCellVerticalDividers>
            <TableCellVerticalDividers>Name</TableCellVerticalDividers>
            <TableCellVerticalDividers>Submitter</TableCellVerticalDividers>
            <TableCellVerticalDividers>Submission</TableCellVerticalDividers>
            <TableCellVerticalDividers>Votes</TableCellVerticalDividers>
            <TableCellVerticalDividers>Average</TableCellVerticalDividers>
            {hasCategories && (
              <>
                <TableCellVerticalDividers>Category</TableCellVerticalDividers>
                <TableCellVerticalDividers>
                  Category Rank
                </TableCellVerticalDividers>
              </>
            )}
            <TableCellVerticalDividers>5 Stars</TableCellVerticalDividers>
            <TableCellVerticalDividers>4 Stars</TableCellVerticalDividers>
            <TableCellVerticalDividers>3 Stars</TableCellVerticalDividers>
            <TableCellVerticalDividers>2 Stars</TableCellVerticalDividers>
            <TableCellVerticalDividers>1 Star</TableCellVerticalDividers>
            <TableCellVerticalDividers>0 Stars</TableCellVerticalDividers>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(
            ({
              average,
              backgroundColor,
              category,
              categoryRank,
              entryId,
              entryName,
              imagePath,
              rank,
              rating0,
              rating1,
              rating2,
              rating3,
              rating4,
              rating5,
              submitter,
              votes,
            }) => (
              <TableRow key={entryId}>
                <TableCellVerticalDividers align="right">
                  {rank}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers>
                  {entryName}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers>
                  {submitter}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="center">
                  <Box sx={{ height: 50 }}>
                    <Submission
                      {...{
                        additionalStyle: {
                          maxHeight: '100%',
                          maxWidth: '100%',
                        },
                        backgroundColor,
                        imagePath,
                        name: entryName,
                      }}
                    />
                  </Box>
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {votes}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {average}
                </TableCellVerticalDividers>
                {hasCategories && (
                  <>
                    <TableCellVerticalDividers>
                      {category}
                    </TableCellVerticalDividers>
                    <TableCellVerticalDividers align="right">
                      {categoryRank}
                    </TableCellVerticalDividers>
                  </>
                )}
                <TableCellVerticalDividers align="right">
                  {rating5}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {rating4}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {rating3}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {rating2}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {rating1}
                </TableCellVerticalDividers>
                <TableCellVerticalDividers align="right">
                  {rating0}
                </TableCellVerticalDividers>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

EntriesTable.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string),
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      entryId: PropTypes.string.isRequired,
      entryName: PropTypes.string.isRequired,
      submitter: PropTypes.string.isRequired,
      votes: PropTypes.number.isRequired,
      average: PropTypes.number.isRequired,
      category: PropTypes.string,
      categoryRank: PropTypes.number,
      rating5: PropTypes.number.isRequired,
      rating4: PropTypes.number.isRequired,
      rating3: PropTypes.number.isRequired,
      rating2: PropTypes.number.isRequired,
      rating1: PropTypes.number.isRequired,
      rating0: PropTypes.number.isRequired,
      imagePath: PropTypes.string.isRequired,
      backgroundColor: types.backgroundColor,
    }),
  ),
};

EntriesTable.defaultProps = {
  categories: [],
  entries: [],
};

export default EntriesTable;
