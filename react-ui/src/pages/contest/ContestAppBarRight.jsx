/**
 * Contest-specific content for top app bar
 */

import EmojiEventsOutlinedIcon from '@material-ui/icons/EmojiEventsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import ThumbsUpDownOutlinedIcon from '@material-ui/icons/ThumbsUpDownOutlined';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

import {
  CustomIconButton,
} from '../../components';

export default function ContestAppBarRight({ toggleDrawerOpen, contest }) {
  const { contestId } = useParams();

  const {
    localVoting,
    name,
    validRedditId,
    winnersThreadId,
  } = contest;

  if (!name) {
    return null;
  }

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
  contest: PropTypes.shape({
    localVoting: PropTypes.bool,
    name: PropTypes.string,
    validRedditId: PropTypes.bool,
    winnersThreadId: PropTypes.string,
  }),
};

ContestAppBarRight.defaultProps = {
  toggleDrawerOpen: () => { },
  contest: {
    localVoting: true,
    name: undefined,
    validRedditId: false,
    winnersThreadId: undefined,
  },
};
