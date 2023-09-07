/**
 * Contest-specific content for top app bar
 */

import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { useLocation, useParams } from 'react-router-dom';

import {
  useAuthState,
  useSwrData,
} from '../../common';
import {
  RouterLinkIconButton,
  Countdown,
} from '../../components';
import useSWR from 'swr';

export default function ContestAppBarMain({ handleVotingExpired, handleReload }) {
  const { contestId } = useParams();
  const { state = {} } = useLocation();

  const apiPath = `/contests/${contestId}`;

  const [{ accessToken, refreshToken }] = useAuthState();

  // https://swr.vercel.app/docs/arguments
  const uniqueKey = [apiPath, { accessToken, refreshToken }];
  // fetcher is set as provider in App.jsx and calls getData in index.js
  const {
    data: contest = {},
  } = useSWR(uniqueKey, { revalidateOnMount: false });

  const backLink = (state || {}).back || '/contests';

  const {
    date,
    isContestMode,
    voteEnd,
  } = contest;
  const voteEndDate = new Date(voteEnd);

  return (
    <>
      <RouterLinkIconButton state={{ date }} to={backLink} />
      {isContestMode && (
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
};
