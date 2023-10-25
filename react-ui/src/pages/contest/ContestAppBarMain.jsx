/**
 * Contest-specific content for top app bar
 */

import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import { useVoting } from '../../common';
import {
  RouterLinkIconButton,
  Countdown,
} from '../../components';

export default function ContestAppBarMain({ handleReload, contest }) {
  const { state = {} } = useLocation();
  const { voteEndDate } = useVoting();

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

  return (
    <>
      {/* date allows Contests page to know which year is expanded  */}
      <RouterLinkIconButton state={{ date }} to={backLink} />
      {isContestMode && voteEnd && (
        <Box display="inline-flex" paddingLeft={1.5}>
          <Countdown
            endDate={voteEndDate}
            handleReload={handleReload}
          />
        </Box>
      )}
    </>
  );
}

ContestAppBarMain.propTypes = {
  handleReload: PropTypes.func.isRequired,
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
