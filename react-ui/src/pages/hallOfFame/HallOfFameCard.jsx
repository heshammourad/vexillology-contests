import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import clsx from 'clsx';
import format from 'date-fns/format';
import getYear from 'date-fns/getYear';
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import { useState } from 'react';

import {
  AppBarIconButton,
  ExternalLink,
  HtmlWrapper,
  LazyLoadCardImage,
  RedditUserAttribution,
} from '../../components';
import flair from '../../images/flair.png';

const useStyles = makeStyles((theme) => {
  const FLAIR_START_YEAR = 2015;
  const FLAIR_WIDTH = 25;

  const styles = {
    bestOfYear: {
      '&::after': {
        background: `url("${flair}")`,
        backgroundSize: 'auto 14px',
        content: '""',
        display: 'inline-block',
        height: 14,
        verticalAlign: -2,
        width: FLAIR_WIDTH - 5,
      },
    },
    bestOfYearLabel: {
      marginRight: 4,
    },
    card: {
      marginTop: theme.spacing(3),
    },
    cardContent: {
      flex: 1,
    },
    contestLabel: {
      fontStyle: 'italic',
    },
    description: {
      padding: '0 16px 16px',
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
  };
  for (let i = FLAIR_START_YEAR; i <= 2021; i += 1) {
    const offset = (i - FLAIR_START_YEAR) * FLAIR_WIDTH;
    styles[`bestOfYear${i}`] = { '&::after': { backgroundPosition: `-${offset}px 0` } };
  }
  return styles;
});

function HallOfFameCard({
  entry: {
    contestName,
    date,
    description,
    entryId,
    entryName,
    height,
    redditThreadId,
    user,
    width,
    yearEndContest,
    yearEndWinner,
  },
  imageDisplayWidth,
}) {
  const [expanded, setExpanded] = useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const contestYearLabel = yearEndContest ? '' : `${format(parseISO(date), 'MMM yyyy')} - `;
  const contestLabel = `${contestYearLabel}${contestName}`;
  const imgurUrl = `https://i.imgur.com/${entryId}.png`;
  const year = getYear(parseISO(date));

  const classes = useStyles();
  return (
    <Card className={classes.card} id={`hofc-${date}`} data-year={year}>
      <LazyLoadCardImage
        displayWidth={imageDisplayWidth}
        height={height}
        image={imgurUrl}
        width={width}
      />
      <Box alignItems="flex-end" display="flex">
        <CardContent className={classes.cardContent}>
          {entryName && (
            <Typography
              className={clsx({
                [`${classes.bestOfYear} ${classes[`bestOfYear${year}`]}`]: yearEndWinner,
              })}
              component="div"
              variant="subtitle2"
            >
              {entryName}
              {yearEndWinner && (
                <span className={classes.bestOfYearLabel}>&nbsp;|&nbsp;BEST OF</span>
              )}
            </Typography>
          )}
          <RedditUserAttribution user={user} />
          <div className={classes.contestLabel}>
            {redditThreadId ? (
              <ExternalLink href={`https://redd.it/${redditThreadId}`}>{contestLabel}</ExternalLink>
            ) : (
              contestLabel
            )}
          </div>
        </CardContent>
        <CardActions>
          <AppBarIconButton
            ariaLabel="Open FlagWaver"
            href={`https://krikienoid.github.io/flagwaver/#?src=${imgurUrl}`}
            Icon={FlagTwoToneIcon}
          />
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            disabled={!description}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="Show descrption"
          >
            <ExpandMoreIcon />
          </IconButton>
        </CardActions>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Typography className={classes.description} component="div" variant="caption">
          <HtmlWrapper html={description} />
        </Typography>
      </Collapse>
    </Card>
  );
}

HallOfFameCard.propTypes = {
  entry: PropTypes.shape({
    contestName: PropTypes.string,
    date: PropTypes.string,
    description: PropTypes.string,
    entryId: PropTypes.string,
    entryName: PropTypes.string,
    height: PropTypes.number,
    redditThreadId: PropTypes.string,
    user: PropTypes.string,
    width: PropTypes.number,
    yearEndContest: PropTypes.bool,
    yearEndWinner: PropTypes.bool,
  }).isRequired,
  imageDisplayWidth: PropTypes.number.isRequired,
};

export default HallOfFameCard;
