/* eslint-disable no-console */
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import { useState } from 'react';
import LazyLoad from 'react-lazyload';
import { Link as RouterLink, useParams, useRouteMatch } from 'react-router-dom';
import createPersistedState from 'use-persisted-state';

import { useSwrData } from '../../common';
import { AppBarIconButton, PageWithDrawer, PlainLink } from '../../components';

const useHideTitlesState = createPersistedState('vc.settings.hideTitles');

const useStyles = makeStyles({
  heading: {
    margin: '24px auto',
  },
  icon: {
    color: '#5f6368',
  },
  listItemText: {
    color: '#3c4043',
  },
  entryName: {
    color: 'black',
  },
});

const Contest = () => {
  const { contestId } = useParams();
  const contest = useSwrData(`/contests/${contestId}`) || {};

  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isHideTitles, setHideTitles] = useHideTitlesState(false);

  const toggleHideTitles = () => {
    setHideTitles(!isHideTitles);
  };

  const theme = useTheme();
  const match = useRouteMatch();

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  let imageWidth;
  if (isLgUp) {
    imageWidth = 400;
  } else if (isMdUp) {
    imageWidth = 448;
  } else if (isSmUp) {
    imageWidth = 552;
  } else {
    imageWidth = document.getElementsByTagName('html').clientWidth - 32;
  }

  const classes = useStyles();

  const toggleSettingsOpen = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  const { name, entries } = contest;
  return (
    <PageWithDrawer
      handleClose={() => {
        setSettingsOpen(false);
      }}
      isOpen={isSettingsOpen}
      appBar={{
        className: classes.icon,
        color: 'default',
        right: (
          <AppBarIconButton
            ariaLabel="View settings"
            onClick={toggleSettingsOpen}
            Icon={SettingsOutlinedIcon}
          />
        ),
        children: (
          <IconButton component={RouterLink} to="/contests">
            <ArrowBackIcon />
          </IconButton>
        ),
      }}
      drawer={{
        heading: 'Settings',
        children: (
          <List>
            <ListItem>
              <ListItemText
                className={classes.listItemText}
                id="switch-list-label-hide-titles"
                primary="Hide Titles"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={toggleHideTitles}
                  checked={isHideTitles}
                  inputProps={{ 'aria-labelledby': 'switch-list-label-hide-titles' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        ),
      }}
    >
      {name && (
        <Container fixed>
          <Typography className={classes.heading} variant={isSmUp ? 'h3' : 'h5'} component="h1">
            {name}
          </Typography>
          {entries && (
            <Grid container spacing={2}>
              {entries.map(({
                id, imgurLink, height, name: entryName, width,
              }) => (
                <Grid key={id} item xs={12} md={6} lg={4}>
                  <Card id={id}>
                    <RouterLink
                      component={PlainLink}
                      to={{ pathname: `${match.url}/entry/${id}`, state: { isFromContest: true } }}
                    >
                      <CardActionArea>
                        <LazyLoad height={height * (imageWidth / width)} offset={1080} resize>
                          <CardMedia component="img" image={imgurLink} />
                        </LazyLoad>
                        {!isHideTitles && (
                        <CardContent>
                          <Typography className={classes.entryName} variant="caption">
                            {entryName}
                          </Typography>
                        </CardContent>
                        )}
                      </CardActionArea>
                    </RouterLink>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      )}
    </PageWithDrawer>
  );
};

export default Contest;
