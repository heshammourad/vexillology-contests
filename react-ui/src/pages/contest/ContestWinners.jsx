/**
 * Older contest results style where the top 20 flags were highlighted
 * ??? Check winnerPropTypes
 */

import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React from 'react';

import {
  RedditUserAttribution,
} from '../../components';

import CardImageLink from './CardImageLink';
import Subheader from './Subheader';
import useContestSizing from './useContestSizing';

const useStyles = makeStyles(() => ({
  divider: {
    height: 2,
    marginBottom: 16,
  },
  numberSymbol: {
    marginRight: 4,
  },
  winnerCard: {
    marginTop: 4,
    marginBottom: 16,
  },
  winnerContent: {
    flexGrow: 1,
    paddingTop: 4,
  },
  winnerHeading: {
    columnGap: 8,
    display: 'flex',
  },
}));

function ContestWinners({ winners = [] }) {
  const classes = useStyles();
  const { headingVariant, winnerDisplayWidth } = useContestSizing();

  if (!winners.length) {
    return null;
  }

  return (
    <>
      <Subheader>Top 20</Subheader>
      {winners.map(({
        height, id, imagePath, name: entryName, rank, user, width,
      }) => (
        <React.Fragment key={id}>
          <div id={id} className={classes.winnerHeading}>
            <Typography variant={headingVariant}>
              <span className={classes.numberSymbol}>#</span>
              {rank}
            </Typography>
            <div className={classes.winnerContent}>
              <Typography variant="subtitle2">{entryName}</Typography>
              <Typography variant="caption">
                <RedditUserAttribution user={user} />
              </Typography>
            </div>
          </div>
          <Card className={classes.winnerCard} elevation={2}>
            <CardImageLink
              displayWidth={winnerDisplayWidth}
              height={height}
              id={id}
              image={imagePath}
              width={width}
            />
          </Card>
        </React.Fragment>
      ))}
      <Divider className={classes.divider} />
      <Subheader>All other entries</Subheader>
    </>
  );
}

const winnerPropTypes = {
  height: PropTypes.number,
  id: PropTypes.string,
  imagePath: PropTypes.string,
  entryName: PropTypes.string,
  rank: PropTypes.number,
  user: PropTypes.string,
  width: PropTypes.number,
};

ContestWinners.propTypes = {
  winners: PropTypes.arrayOf(PropTypes.shape(winnerPropTypes)),
};

ContestWinners.defaultProps = {
  winners: [],
};

export default ContestWinners;
