/**
 * Swap between submission tabs
 * @param {func} props.handleTabChange - Swap to different submission tab, reset previewDescription
 * @param {number} props.selectedTab - Current tab
 */

import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import PropTypes from 'prop-types';

function SubmissionTabs({ handleTabChange, selectedTab }) {
  return (
    <Tabs
      value={selectedTab}
      onChange={handleTabChange}
      indicatorColor="primary"
      textColor="primary"
      variant="fullWidth"
    >
      <Tab id="tab-0" label="Contest Prompt" aria-controls="tabpanel-0" />
      <Tab id="tab-1" label="Submission Form" aria-controls="tabpanel-1" />
      <Tab id="tab-2" label="Current Submissions" aria-controls="tabpanel-2" />
    </Tabs>
  );
}

export default SubmissionTabs;

SubmissionTabs.propTypes = {
  selectedTab: PropTypes.number.isRequired,
  handleTabChange: PropTypes.func.isRequired,
};
