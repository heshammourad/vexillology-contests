import Box from '@mui/material/Box';
import PropTypes from 'prop-types';

function TabPanel({ children, currentTab, index }) {
  return (
    <div
      role="tabpanel"
      hidden={currentTab !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {currentTab === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  currentTab: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

export default TabPanel;
