import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
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

const drawerWidth = 160;

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  container: {
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(4),
  },
  content: {
    flexGrow: 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
}));

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
    const toolbarHeight = document.getElementById('toolbar').offsetHeight;
    const year = Array.from(document.querySelectorAll('[id^=hofc]')).find(
      (entry) => entry.getBoundingClientRect().bottom > toolbarHeight,
    ).attributes['data-year'].value;
    if (year !== selectedYear) {
      setSelectedYear(year);
    }
  }, 100);

  useEffect(() => {
    document.addEventListener('scroll', scrollHandler);

    return () => document.removeEventListener('scroll', scrollHandler);
  }, []);

  // const handleDrawerToggle = () => {
  //   setMobileOpen(!mobileOpen);
  // };

  const theme = useTheme();
  const clientWidth = useClientWidth();

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  // eslint-disable-next-line max-len
  const imageWidth = Math.min(clientWidth - drawerWidth, theme.breakpoints.values.md) - (isSmUp ? 48 : 32);

  const handleTabsChange = (event, newValue) => {
    setSelectedYear(newValue);
    const el = document.getElementById(`hofc-${groups[newValue][0].date}`);
    const top = Math.floor(
      el.getBoundingClientRect().top
        + window.scrollY
        - document.getElementById('toolbar').offsetHeight
        - theme.spacing(3) / 2,
    );
    targetTop = top;
    window.scrollTo({ behavior: 'smooth', top });
  };

  const classes = useStyles();
  const drawer = (
    <div>
      <Toolbar id="toolbar" />
      <Tabs
        orientation="vertical"
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
    </div>
  );

  return (
    <Box display="flex">
      <Header className={classes.appBar} position="fixed" to="/">
        Hall of Fame
      </Header>
      <Hidden smUp implementation="css">
        {/* Add mobile implementation here */}
      </Hidden>
      <Hidden xsDown className={classes.drawer} implementation="css">
        <Drawer classes={{ paper: classes.drawerPaper }} open variant="permanent">
          {drawer}
        </Drawer>
      </Hidden>
      <main className={classes.content}>
        <Toolbar />
        {hallOfFame && !!hallOfFame.length && (
          <Container className={classes.container} maxWidth="md">
            {hallOfFame.map((entry) => (
              <HallOfFameCard key={entry.entryId} entry={entry} imageDisplayWidth={imageWidth} />
            ))}
          </Container>
        )}
      </main>
    </Box>
  );
};

export default HallOfFame;
