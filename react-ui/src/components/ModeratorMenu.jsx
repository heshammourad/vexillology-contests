import FactCheckIcon from '@mui/icons-material/FactCheck';
import InsightsIcon from '@mui/icons-material/Insights';
import List from '@mui/material/List';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import CustomBadge from './CustomBadge';
import MenuItemLink from './MenuItemLink';

const MODERATOR_MENU_ITEMS = {
  review: {
    Icon: FactCheckIcon,
    text: 'Review Submissions',
  },
  analyze: {
    Icon: InsightsIcon,
    text: 'Analyze Votes',
  },
};

function badgedIcon(badgedIcons, Icon, item) {
  return function BadgedIcon() {
    return (
      <CustomBadge invisible={!badgedIcons.includes(item)}>
        <Icon />
      </CustomBadge>
    );
  };
}

function ModeratorMenu({
  badgedIcons, highlightSelected, onClick, sx,
}) {
  const { pathname } = useLocation();

  const paths = pathname.split('/');

  return (
    <List {...{ sx }}>
      {Object.entries(MODERATOR_MENU_ITEMS).map(([item, { Icon, text }]) => (
        <MenuItemLink
          key={item}
          Icon={badgedIcon(badgedIcons, Icon, item)}
          onClick={onClick}
          selected={highlightSelected && paths.includes(item)}
          text={text}
          to={`/mod/${item}`}
        />
      ))}
    </List>
  );
}

ModeratorMenu.propTypes = {
  badgedIcons: PropTypes.arrayOf(PropTypes.string),
  highlightSelected: PropTypes.bool,
  onClick: PropTypes.func,
  sx: PropTypes.shape({}),
};

ModeratorMenu.defaultProps = {
  badgedIcons: [],
  highlightSelected: false,
  onClick: undefined,
  sx: {},
};

export default ModeratorMenu;
