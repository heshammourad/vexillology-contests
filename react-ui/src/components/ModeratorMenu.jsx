// import Block from '@mui/icons-material/Block';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GradingIcon from '@mui/icons-material/Grading';
// import GroupRemove from '@mui/icons-material/GroupRemove';
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
  // 'banUsers?u=ASmallEye': {
  //   Icon: Block,
  //   text: 'NOT DIRECTLY ACCESSIBLE', // delete this once analyze and viewBans are complete
  // },
  // viewBans: {
  //   Icon: GroupRemove,
  //   text: 'View Bans',
  // },
  contestSummary: {
    Icon: GradingIcon,
    text: 'Contest Summary',
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

/**
 * ModeratorMenu component renders a list of menu items for moderators.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.badgedIcons - List of icons to add a badge to.
 * @param {boolean} props.highlightSelected - Whether to highlight the selected menu item.
 * @param {function} props.onClick - The function to call when a menu item is clicked.
 * @param {Object} props.sx - The style object to apply to the List component.
 *
 * @returns {JSX.Element} The rendered ModeratorMenu component.
 */
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
