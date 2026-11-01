/**
 * Prompt for contest submission
 */
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { ContestRulesLink, FormattedContent } from '../../components';

function SubmissionPrompt({ prompt }) {
  if (!prompt) {
    return null;
  }
  return (
    <>
      <FormattedContent content={prompt} isMarkdown />
      <ContestRulesLink />
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
