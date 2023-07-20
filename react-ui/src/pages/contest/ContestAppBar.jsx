/**
 * Voting and winners
 */

import Box from '@material-ui/core/Box';
import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import {
  useSwrData,
} from '../../common';
import {
  ArrowBackButton,
  CustomIconButton,
  Countdown,
} from '../../components';

function ContestAppBarMain({ handleVotingExpired, handleReload }) {
  const { contestId } = useParams();
  const { state = {} } = useLocation();

  const apiPath = `/contests/${contestId}`;
  const { data: contest } = useSwrData(apiPath, false);

  const backLink = (state || {}).back || '/contests';

  const {
    date,
    isContestMode,
    voteEnd,
  } = contest;
  const voteEndDate = new Date(voteEnd);

  return (
    <>
      <ArrowBackButton state={{ date }} to={backLink} />
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

function ContestAppBarRight() {
  const { contestId } = useParams();

  const apiPath = `/contests/${contestId}`;
  const { data: contest } = useSwrData(apiPath, false);

  const [isInfoOpen, setInfoOpen] = useState(false);

  const toggleSettingsOpen = () => {
    setInfoOpen(!isInfoOpen);
  };

  const {
    localVoting,
    validRedditId,
    winnersThreadId,
  } = contest;

  return (
    <>
      {!localVoting && validRedditId && (
        <CustomIconButton
          href={`https://redd.it/${contestId}`}
          ariaLabel="Open voting thread"
          Icon={ThumbsUpDownOutlinedIcon}
        />
      )}
      {winnersThreadId && (
        <CustomIconButton
          href={`https://redd.it/${winnersThreadId}`}
          ariaLabel="Open winners thread"
          Icon={EmojiEventsOutlinedIcon}
        />
      )}
      <CustomIconButton
        ariaLabel="View settings"
        onClick={toggleSettingsOpen}
        Icon={SettingsOutlinedIcon}
      />
    </>
  );
}

ContestAppBarMain.propTypes = {
  handleVotingExpired: PropTypes.func,
  handleReload: PropTypes.func,
};

ContestAppBarMain.defaultProps = {
  handleVotingExpired: () => { },
  handleReload: () => { },
};

export { ContestAppBarMain, ContestAppBarRight };
