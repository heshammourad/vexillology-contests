/**
 * Contest-specific content for top app bar
 */

import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import {
  RouterLinkIconButton,
  Countdown,
} from '../../components';

export default function ContestAppBarMain({ handleVotingExpired, handleReload, contest }) {
  const { state = {} } = useLocation();

  const backLink = (state || {}).back || '/contests';

  const {
    date,
    isContestMode,
    name,
    voteEnd,
  } = contest;

  if (!name) {
    return null;
  }

  const voteEndDate = new Date(voteEnd);

  return (
    <>
      {/* date allows Contests page to know which year is expanded  */}
      <RouterLinkIconButton state={{ date }} to={backLink} />
      {isContestMode && voteEnd && (
        <Box display="inline-flex" paddingLeft={1.5}>
          <Countdown
            endDate={voteEndDate}
            handleExpiry={handleVotingExpired}
            handleReload={handleReload}
          />
        </Box>
      )}
    </>
  );
}

ContestAppBarMain.propTypes = {
  handleReload: PropTypes.func.isRequired,
  handleVotingExpired: PropTypes.func.isRequired,
  contest: PropTypes.shape({
    date: PropTypes.string.isRequired,
    isContestMode: PropTypes.bool,
    name: PropTypes.string,
    voteEnd: PropTypes.string,
  }),
};

ContestAppBarMain.defaultProps = {
  contest: {
    isContestMode: PropTypes.false,
    name: undefined,
    voteEnd: null,
  },
};
