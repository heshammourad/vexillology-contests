import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

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
  const {
    categories,
    isContestMode,
    resultsCertified,
    votingWindowOpen,
    winners,
  } = contest;

  if (votingWindowOpen === false) {
    // votingWindowOpen is false when there are entries that haven't been
    // approved by moderators yet
    return <ContestUnderReview {...{ isValidating, mutate }} />;
  }

  if (resultsCertified === false) {
    // resultsCertified is false when voting is done, but the results haven't
    // been certified by an admin yet
    return <ContestResultsNotCertified {...{ isValidating, mutate }} />;
  }

  return (
    <>
      {isContestMode && (
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
