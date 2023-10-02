/**
 * ??? early return null will create error if change in number of hooks found
 */
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import RedditIcon from '@material-ui/icons/Reddit';
import differenceInDays from 'date-fns/differenceInDays';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { useComponentsState } from '../common';
import useSwrContest from '../utils/useSwrContest';

import Average from './Average';
import CategoryLabel from './CategoryLabel';
import Countdown from './Countdown';
import DrawerSectionHeader from './DrawerSectionHeader';
import FiveStar from './FiveStar';
import FmpIcon from './FmpIcon';
import HtmlWrapper from './HtmlWrapper';
import ListItemButton from './ListItemButton';
import RedditMarkdown from './RedditMarkdown';
import RedditUserAttribution from './RedditUserAttribution';
import VotingSlider from './VotingSlider';

const useStyles = makeStyles({
  average: {
    flexGrow: 1,
    fontWeight: 'bold',
  },
  drawerContent: {
    fontSize: '16px',
    padding: '20px 24px',
    wordBreak: 'break-word',
  },
  entryName: {
    fontWeight: 'bold',
  },
  myRating: {
    display: 'flex',
    fontStyle: 'italic',
    textAlign: 'end',
  },
  rank: {
    flexShrink: 0,
    fontWeight: 'bold',
    paddingRight: 8,
  },
  votingContainer: {
    marginTop: 16,
  },
});

function EntryDescriptionDrawer({ entryId }) {
  if (!entryId) {
    return null;
  }

  const [{ votingDisabled }, setComponentsState] = useComponentsState();
  const [votingExpired, setVotingExpired] = useState(false);

  const {
    data: {
      categories, entries = [], isContestMode, localVoting, voteEnd, winners = [],
    },
    mutate,
  } = useSwrContest();
  const {
    average,
    category,
    categoryRank,
    description,
    imagePath,
    imgurId,
    id,
    markdown,
    name,
    permalink,
    rank,
    rating,
    user,
  } = [...winners, ...entries].find((entry) => entry.id === entryId) || {};

  const imageSrc = window.location.origin + imagePath;
  const flagWaverLink = `https://krikienoid.github.io/flagwaver/#?src=${imageSrc}`;
  const redditPermalink = `https://www.reddit.com${permalink}`;
  const showRank = localVoting && !!rank;
  const voteEndDate = new Date(voteEnd);
  const votingUnavailable = votingDisabled || votingExpired;

  const handleVotingExpired = () => {
    if (!votingExpired) {
      mutate();
      setVotingExpired(true);
    }
  };

  const classes = useStyles();
  return (
    <div className={classes.drawerContent}>
      <Box display="flex">
        {showRank && (
          <div className={classes.rank}>
            #
            {rank}
          </div>
        )}
        <Box>
          <div className={classes.entryName}>{name}</div>
          {showRank && (
            <Typography variant="caption">
              <RedditUserAttribution user={user} />
            </Typography>
          )}
        </Box>
      </Box>
      {category && (
        <Box paddingTop={1}>
          <CategoryLabel categories={categories} category={category} categoryRank={categoryRank} />
        </Box>
      )}
      {isContestMode ? (
        <>
          <DrawerSectionHeader>Submit Vote</DrawerSectionHeader>
          {!differenceInDays(voteEndDate, new Date()) && (
            <Countdown endDate={voteEndDate} fontSize="small" handleExpiry={handleVotingExpired} />
          )}
          <Box className={classes.votingContainer} alignItems="center" display="flex">
            <VotingSlider
              disabled={votingUnavailable}
              entryId={imgurId ?? id}
              rating={rating}
              setComponentsState={setComponentsState}
            />
          </Box>
        </>
      ) : (
        <Box alignItems="baseline" display="flex" paddingTop={1}>
          <Average className={classes.average} average={average} />
          {rating > -1 && (
            <Typography className={classes.myRating} variant="caption">
              My rating:&nbsp;
              <FiveStar rating={rating} />
            </Typography>
          )}
        </Box>
      )}
      <DrawerSectionHeader>Description</DrawerSectionHeader>
      {markdown ? <RedditMarkdown text={description} /> : <HtmlWrapper html={description} />}
      <DrawerSectionHeader>Links</DrawerSectionHeader>
      <List>
        {!localVoting && (
          <ListItemButton href={redditPermalink} Icon={RedditIcon} text="Open Reddit comment" />
        )}
        <ListItemButton href={flagWaverLink} Icon={FlagTwoToneIcon} text="Open FlagWaver" />
        <ListItemButton
          href="https://flagmaker-print.com/"
          Icon={FmpIcon}
          target="_blank"
          text="Design & Print your own flag with FMP"
        />
      </List>
    </div>
  );
}

EntryDescriptionDrawer.propTypes = {
  entryId: PropTypes.string,
};

EntryDescriptionDrawer.defaultProps = {
  entryId: undefined,
};

export default EntryDescriptionDrawer;
