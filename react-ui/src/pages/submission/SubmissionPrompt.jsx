/**
 * Prompt for contest submission
 */
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { FormattedContent, InternalLink } from '../../components';

function SubmissionPrompt({ prompt }) {
  if (!prompt) {
    return null;
  }
  return (
    <>
      <FormattedContent content={prompt} isMarkdown />
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
  prompt: PropTypes.string,
};

SubmissionPrompt.defaultProps = {
  prompt: '',
};
