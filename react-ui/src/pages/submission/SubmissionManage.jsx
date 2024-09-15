/**
 * Allow user to manage their existing submissions
 * @param {func} props.handleTabChange - Swap to different submission tab, reset previewDescription
 * @param {Object[]} props.submissions - The list of submissions to display
 */

import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';

import types from '../../common/types';
import { InternalLink, SubmissionsTable } from '../../components';

const useStyles = makeStyles((theme) => ({
  currentSubmissions: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing(2),
  },
  submitAnotherButton: {
    marginLeft: theme.spacing(2),
  },
}));

function SubmissionManage({ handleTabChange, submissions }) {
  const switchToSubmissionFormTab = () => {
    handleTabChange(null, 1);
  };

  const classes = useStyles();

  if (!submissions?.length) {
    return (
      <div>
        You have not submitted any entries yet. Click&nbsp;
        <InternalLink onClick={switchToSubmissionFormTab}>here</InternalLink>
        &nbsp;to get started.
      </div>
    );
  }

  return (
    <div className={classes.currentSubmissions}>
      <div>
        <span>
          You have
          {' '}
          {submissions.length
            ? `submitted ${pluralize('entry', submissions.length, true)}`
            : 'not submitted any entries yet'}
          .
        </span>
        <Button
          className={classes.submitAnotherButton}
          color="primary"
          onClick={switchToSubmissionFormTab}
          variant="contained"
        >
          Submit
          {!!submissions.length && ' Another'}
        </Button>
      </div>
      <div />
      <SubmissionsTable submissions={submissions} />
    </div>
  );
}

export default SubmissionManage;

SubmissionManage.propTypes = {
  handleTabChange: PropTypes.func.isRequired,
  submissions: PropTypes.arrayOf(types.submission),
};

SubmissionManage.defaultProps = {
  submissions: [],
};
