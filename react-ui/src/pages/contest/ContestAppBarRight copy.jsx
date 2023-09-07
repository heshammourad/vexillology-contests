/**
 * Contest-specific content for top app bar
 */

import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

import {
  useAuthState,
  useSwrData,
} from '../../common';
import {
  CustomIconButton,
} from '../../components';

import useSWR from 'swr';

export default function ContestAppBarRight({ toggleDrawerOpen }) {
  const { contestId } = useParams();

  const apiPath = `/contests/${contestId}`;
  // const { data: contest } = useSwrData(apiPath, false);

  const [{ accessToken, refreshToken }] = useAuthState();

  // https://swr.vercel.app/docs/arguments
  const uniqueKey = [apiPath, { accessToken, refreshToken }];
  // fetcher is set as provider in App.jsx and calls getData in index.js
  const {
    data: contest = {},
  } = useSWR(uniqueKey, { revalidateOnMount: false });

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
        onClick={toggleDrawerOpen}
        Icon={SettingsOutlinedIcon}
      />
    </>
  );
}

ContestAppBarRight.propTypes = {
  toggleDrawerOpen: PropTypes.func,
};

ContestAppBarRight.defaultProps = {
  toggleDrawerOpen: () => { },
};
