/**
 * Full page entry
 */

import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import RedditIcon from '@material-ui/icons/Reddit';
import PropTypes from 'prop-types';
import { useParams, useLocation } from 'react-router-dom';

import { useScrollState, useSwrData } from '../../common';
import {
  ArrowBackButton,
  CustomIconButton,
} from '../../components';

function EntryAppBarMain({ entryId }) {
  const { state = {} } = useLocation();
  const [scroll, setScroll] = useScrollState();
  const { contestId } = useParams();
  const apiPath = `/contests/${contestId}`;
  const { data } = useSwrData(apiPath, false);

  const {
    requestId,
  } = data;

  return (
    <ArrowBackButton
      color="inherit"
      onClick={() => {
        setScroll({ ...scroll, entryId });
      }}
      state={{
        back: state?.back,
        requestId,
        selectedCategories: state?.selectedCategories ?? [],
      }}
      to={`/contests/${contestId}`}
    />
  );
}

// eslint-disable-next-line react/prop-types, max-len, object-curly-newline
function EntryAppBarRight({ toggleInfoDrawerOpen, redditCommentButtonRef, flagWaverButtonRef, entry = {}, data = {} }) {
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

EntryAppBarMain.propTypes = {
  entryId: PropTypes.string,
};

EntryAppBarMain.defaultProps = {
  entryId: '',
};

export { EntryAppBarMain, EntryAppBarRight };
