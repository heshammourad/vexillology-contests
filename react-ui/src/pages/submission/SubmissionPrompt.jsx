/**
 * Prompt for contest submission
 */
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { FormattedContent, InternalLink } from '../../components';

import May23 from './content/May23';

function SubmissionPrompt({ contestId, prompt }) {
  if (!prompt) {
    return null;
  }
  let content = <FormattedContent content={prompt} markdown />;
  if (contestId === 'may23') {
    content = <May23 />;
  }
  return (
    <>
      {content}
      <InternalLink to="rules">
        <Typography component="span" variant="h6">
          Please read the contest rules in full before submitting.
        </Typography>
      </InternalLink>
      <Outlet />
    </>
  );
}

export default SubmissionPrompt;

SubmissionPrompt.propTypes = {
  contestId: PropTypes.string,
  prompt: PropTypes.string,
};

SubmissionPrompt.defaultProps = {
  contestId: '',
  prompt: '',
};
