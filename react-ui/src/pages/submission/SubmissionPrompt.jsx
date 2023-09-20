/**
 * Prompt for contest submission
 */
import PropTypes from 'prop-types';

import {
  RedditMarkdown,
} from '../../components';

import May23 from './content/May23';

function SubmissionPrompt({ contestId, prompt }) {
  if (contestId === 'may23') {
    return <May23 />;
  }
  if (!prompt) {
    return null;
  }
  return <RedditMarkdown text={prompt} />;
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
