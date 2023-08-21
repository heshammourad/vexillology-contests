/**
 * Entry-specific content for top app bar
 */

import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import RedditIcon from '@material-ui/icons/Reddit';
import PropTypes from 'prop-types';

import {
  CustomIconButton,
} from '../../components';

export default function EntryAppBarRight({
  // eslint-disable-next-line react/prop-types
  toggleInfoDrawerOpen, redditCommentButtonRef, flagWaverButtonRef, entry = {}, data = {},
}) {
  const {
    localVoting,
  } = data;

  const {
    imagePath,
    permalink,
  } = entry;

  const imageSrc = window.location.origin + imagePath;
  const redditPermalink = `https://www.reddit.com${permalink}`;
  const flagWaverLink = `https://krikienoid.github.io/flagwaver/#?src=${imageSrc}`;

  return (
    <>
      {!localVoting && (
        <CustomIconButton
          innerRef={redditCommentButtonRef}
          href={redditPermalink}
          ariaLabel="Open Reddit comment"
          Icon={RedditIcon}
        />
      )}
      <CustomIconButton
        innerRef={flagWaverButtonRef}
        href={flagWaverLink}
        ariaLabel="Open FlagWaver"
        Icon={FlagTwoToneIcon}
      />
      <CustomIconButton
        ariaLabel="Open info"
        onClick={toggleInfoDrawerOpen}
        Icon={InfoOutlinedIcon}
      />
    </>
  );
}

EntryAppBarRight.propTypes = {
};

EntryAppBarRight.defaultProps = {
};
