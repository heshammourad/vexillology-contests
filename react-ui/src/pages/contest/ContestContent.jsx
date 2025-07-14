import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

import ContestStatus from '../../../../shared/ContestStatus';
/* eslint-disable no-restricted-imports */
import StaticContent from '../../components/StaticContent';
import useSwrContest from '../../data/useSwrContest';

import ContestCategorySelector from './ContestCategorySelector';
import ContestGrid from './ContestGrid';
import ContestResultsNotCertified from './ContestResultsNotCertified';
import ContestUnderReview from './ContestUnderReview';
import ContestWinners from './ContestWinners';

function ContestContent({
  selectedCategories,
  setDrawer,
  setSelectedCategories,
}) {
  const { data: contest, isValidating, mutate } = useSwrContest();
  const { categories, contestStatus, winners } = contest;

  if (contestStatus === ContestStatus.SUBMISSIONS_CLOSED) {
    return <ContestUnderReview {...{ isValidating, mutate }} />;
  }

  if (contestStatus === ContestStatus.VOTING_CLOSED) {
    return <ContestResultsNotCertified {...{ isValidating, mutate }} />;
  }

  return (
    <>
      {contestStatus === ContestStatus.VOTING_OPEN && (
        <Box marginBottom={3}>
          <Typography component="div" variant="subtitle1">
            <StaticContent id="voting_instructions" />
          </Typography>
        </Box>
      )}
      <ContestCategorySelector
        {...{ categories, selectedCategories, setSelectedCategories }}
      />
      <ContestWinners {...{ winners }} />
      <ContestGrid
        {...{
          selectedCategories,
          setDrawer,
        }}
      />
    </>
  );
}

ContestContent.propTypes = {
  selectedCategories: PropTypes.arrayOf(PropTypes.string),
  setDrawer: PropTypes.func.isRequired,
  setSelectedCategories: PropTypes.func.isRequired,
};

ContestContent.defaultProps = {
  selectedCategories: [],
};

export default ContestContent;
