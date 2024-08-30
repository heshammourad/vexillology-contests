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
  CustomIconButton,
  ExternalLink,
  FormattedContent,
  LazyLoadCardImage,
  RedditMarkdown,
  RedditUserAttribution,
} from '../../components';
import flair from '../../images/flair.png';

// The first year available in /images/flair.png.
const FLAIR_START_YEAR = 2015;
// The last year available in /images/flair.png.
const FLAIR_END_YEAR = 2023;
const FLAIR_WIDTH = 25;

const useStyles = makeStyles((theme) => {
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
      position: 'relative',
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

  const currentYear = getYear(new Date());
  for (let i = FLAIR_START_YEAR; i <= currentYear; i += 1) {
    const style = {};
    if (i <= FLAIR_END_YEAR) {
      // If the flair is available in images/flair.png, set the horizontal offset.
      const offset = (i - FLAIR_START_YEAR) * FLAIR_WIDTH;
      style.backgroundPosition = `-${offset}px 0`;
    } else {
      // If the flair is not available, use year text instead.
      style.background = 'none';
      style.content = `"${i}"`;
      style.verticalAlign = 0;
    }

    styles[`bestOfYear${i}`] = { '&::after': style };
  }

  return styles;
});

function HallOfFameCard({
  entry: {
    contestName,
    date,
    description,
    entryName,
    height,
    imagePath,
    markdown,
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

  const contestYearLabel = yearEndContest
    ? ''
    : `${format(parseISO(date), 'MMM yyyy')} - `;
  const contestLabel = `${contestYearLabel}${contestName}`;
  const year = getYear(parseISO(date));

  const classes = useStyles();
  return (
    <Card className={classes.card} id={`hofc-${date}`} data-year={year}>
      <LazyLoadCardImage
        displayWidth={imageDisplayWidth}
        height={height}
        image={imagePath}
        width={width}
      />
      <Box alignItems="flex-end" display="flex">
        <CardContent className={classes.cardContent}>
          {entryName && (
            <Typography
              className={clsx({
                [`${classes.bestOfYear} ${classes[`bestOfYear${year}`]}`]:
                  yearEndWinner,
              })}
              component="div"
              variant="subtitle2"
            >
              {entryName}
              {yearEndWinner && (
                <span className={classes.bestOfYearLabel}>
                  &nbsp;|&nbsp;BEST OF
                </span>
              )}
            </Typography>
          )}
          <RedditUserAttribution user={user} />
          <div className={classes.contestLabel}>
            {redditThreadId ? (
              <ExternalLink href={`https://redd.it/${redditThreadId}`}>
                {contestLabel}
              </ExternalLink>
            ) : (
              contestLabel
            )}
          </div>
        </CardContent>
        <CardActions>
          <CustomIconButton
            ariaLabel="Open FlagWaver"
            href={`https://krikienoid.github.io/flagwaver/#?src=${window.location.origin}${imagePath}`}
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
        <Typography
          className={classes.description}
          component="div"
          variant="caption"
        >
          <FormattedContent content={description} markdown={markdown} />
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
    entryName: PropTypes.string,
    height: PropTypes.number,
    imagePath: PropTypes.string,
    markdown: PropTypes.bool,
    redditThreadId: PropTypes.string,
    user: PropTypes.string,
    width: PropTypes.number,
    yearEndContest: PropTypes.bool,
    yearEndWinner: PropTypes.bool,
  }).isRequired,
  imageDisplayWidth: PropTypes.number.isRequired,
};

export default HallOfFameCard;
