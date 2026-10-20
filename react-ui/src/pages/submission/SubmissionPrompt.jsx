/**
 * Prompt for contest submission
 */
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { ContestRulesLink, FormattedContent } from '../../components';

import May23 from './content/May23';

function SubmissionPrompt({ contestId, prompt }) {
  if (!prompt) {
    return null;
  }
  return (
    <>
      {contestId === 'may23' ? (
        <May23 />
      ) : (
        <FormattedContent content={prompt} isMarkdown />
      )}
      <ContestRulesLink />
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
