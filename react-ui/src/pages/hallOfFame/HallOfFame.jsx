import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import getYear from 'date-fns/getYear';
import parseISO from 'date-fns/parseISO';
import groupBy from 'lodash/groupBy';
import throttle from 'lodash/throttle';
import { useState, useEffect } from 'react';

import { useClientWidth, useSwrData } from '../../common';
import { Header } from '../../components';

import HallOfFameCard from './HallOfFameCard';

const tabsHeight = 48;

const useStyles = makeStyles((theme) => ({
  content: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4) + tabsHeight,
  },
  tabsContainer: {
    flexGrow: 1,
    left: 0,
    position: 'fixed',
    right: 0,
    zIndex: 1000,
  },
  tabsRoot: {
    justifyContent: 'center',
  },
  tabsScroller: {
    flexGrow: '0',
  },
}));

const TOOLBAR_ID = 'hofToolbar';

const getToolbarHeight = () => document.getElementById(TOOLBAR_ID).offsetHeight;

let targetTop = null;

const HallOfFame = () => {
  const hallOfFame = useSwrData('/hallOfFame');

  // const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState();
  const [groups, setGroups] = useState({});

  useEffect(() => {
    if (hallOfFame) {
      const entryGroups = groupBy(hallOfFame, ({ date }) => getYear(parseISO(date)));
      setGroups(entryGroups);
      setSelectedYear(Math.max(...Object.keys(entryGroups)).toString());
    }
  }, [hallOfFame]);

  const scrollHandler = throttle(() => {
    if (targetTop) {
      if (window.scrollY === targetTop) {
        targetTop = null;
      }
      return;
    }
    const year = Array.from(document.querySelectorAll('[id^=hofc]')).find(
      (entry) => entry.getBoundingClientRect().bottom > getToolbarHeight() + tabsHeight,
    ).attributes['data-year'].value;
    if (year !== selectedYear) {
      setSelectedYear(year);
    }
  }, 100);

  useEffect(() => {
    document.addEventListener('scroll', scrollHandler);

    return () => document.removeEventListener('scroll', scrollHandler);
  }, []);

  const theme = useTheme();
  const clientWidth = useClientWidth();

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const imageWidth = Math.min(clientWidth, theme.breakpoints.values.md) - (isSmUp ? 48 : 32);

  const handleTabsChange = (event, newValue) => {
    setSelectedYear(newValue);
    const el = document.getElementById(`hofc-${groups[newValue][0].date}`);
    const top = Math.floor(
      el.getBoundingClientRect().top
        + window.scrollY
        - getToolbarHeight()
        - tabsHeight
        - theme.spacing(3) / 2,
    );
    targetTop = top;
    window.scrollTo({ behavior: 'smooth', top });
  };

  const classes = useStyles();
  return (
    <>
      <Header className={classes.appBar} position="fixed" to="/">
        Hall of Fame
      </Header>
      <Toolbar id={TOOLBAR_ID} />
      <Paper className={classes.tabsContainer} square>
        <Tabs
          classes={{ root: classes.tabsRoot, scroller: classes.tabsScroller }}
          centered
          onChange={handleTabsChange}
          variant="scrollable"
          value={selectedYear}
        >
          {Object.keys(groups)
            .sort((a, b) => b - a)
            .map((year) => (
              <Tab key={year} label={year} value={year} />
            ))}
        </Tabs>
      </Paper>
      {hallOfFame && !!hallOfFame.length && (
        <Container className={classes.content} maxWidth="md">
          {hallOfFame.map((entry) => (
            <HallOfFameCard key={entry.entryId} entry={entry} imageDisplayWidth={imageWidth} />
          ))}
        </Container>
      )}
    </>
  );
};

export default HallOfFame;
