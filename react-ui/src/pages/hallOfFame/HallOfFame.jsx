import Container from '@material-ui/core/Container';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import getYear from 'date-fns/getYear';
import parseISO from 'date-fns/parseISO';
import groupBy from 'lodash/groupBy';
import { useState, useEffect } from 'react';

import { useClientWidth, useSwrData } from '../../common';
import { Header } from '../../components';

import HallOfFameCard from './HallOfFameCard';

const drawerWidth = 160;
const topOffset = 88;

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  container: {
    marginBottom: 32,
    marginTop: topOffset,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
}));

const HallOfFame = () => {
  const hallOfFame = useSwrData('/hallOfFame');

  // const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(false);
  const [groups, setGroups] = useState({});

  useEffect(() => {
    if (hallOfFame) {
      setGroups(groupBy(hallOfFame, ({ date }) => getYear(parseISO(date))));
    }
  }, [hallOfFame]);

  // const handleDrawerToggle = () => {
  //   setMobileOpen(!mobileOpen);
  // };
  const handleTabsChange = (event, newValue) => {
    setSelectedYear(newValue);
    const el = document.getElementById(`hofc-${groups[newValue][0].date}`);
    const top = el.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({ behavior: 'smooth', top });
  };

  const theme = useTheme();
  const clientWidth = useClientWidth();

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const imageWidth = Math.min(clientWidth, 960) - (isSmUp ? 48 : 32);

  const classes = useStyles();
  const drawer = (
    <div>
      <div className={classes.toolbar} />
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
    <>
      <Header className={classes.appBar} position="fixed" to="/">
        Hall of Fame
      </Header>
      <Hidden smUp implementation="css">
        {/* Add mobile implementation here */}
      </Hidden>
      <Hidden xsDown implementation="css">
        <Drawer classes={{ paper: classes.drawerPaper }} open variant="permanent">
          {drawer}
        </Drawer>
      </Hidden>
      {hallOfFame && !!hallOfFame.length && (
        <Container className={classes.container} maxWidth="md">
          {hallOfFame.map((entry) => (
            <HallOfFameCard key={entry.entryId} entry={entry} imageDisplayWidth={imageWidth} />
          ))}
        </Container>
      )}
    </>
  );
};

export default HallOfFame;
