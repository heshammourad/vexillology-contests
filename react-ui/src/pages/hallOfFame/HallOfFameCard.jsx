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
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import { useState } from 'react';

import {
  AppBarIconButton, ExternalLink, HtmlWrapper, LazyLoadCardImage,
} from '../../components';

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: 24,
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
}));

const HallOfFameCard = ({
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
  },
  imageDisplayWidth,
}) => {
  const [expanded, setExpanded] = useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const contestLabel = `${format(parseISO(date), 'MMM yyyy')} - ${contestName}`;
  const imgurUrl = `https://i.imgur.com/${entryId}.png`;

  const classes = useStyles();
  return (
    <Card className={classes.card}>
      <LazyLoadCardImage
        displayWidth={imageDisplayWidth}
        height={height}
        image={imgurUrl}
        width={width}
      />
      <Box alignItems="flex-end" display="flex">
        <CardContent className={classes.cardContent}>
          {entryName && (
            <Typography component="div" variant="subtitle2">
              {entryName}
            </Typography>
          )}
          <div>
            by
            {' '}
            <ExternalLink href={`https://reddit.com${user}`}>{user}</ExternalLink>
          </div>
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
};

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
  }).isRequired,
  imageDisplayWidth: PropTypes.number.isRequired,
};

export default HallOfFameCard;
