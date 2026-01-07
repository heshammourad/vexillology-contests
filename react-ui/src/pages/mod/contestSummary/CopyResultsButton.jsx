import Button from '@material-ui/core/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PropTypes from 'prop-types';
import { useState } from 'react';

function CopyResultsButton({ resultsMarkdown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultsMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // DO NOTHING
    }
  };

  return (
    <Button
      color="primary"
      disabled={!resultsMarkdown}
      onClick={handleCopy}
      startIcon={<ContentCopyIcon />}
      variant="outlined"
    >
      {copied ? 'Copied!' : 'Copy Results'}
    </Button>
  );
}

CopyResultsButton.propTypes = {
  resultsMarkdown: PropTypes.string,
};

CopyResultsButton.defaultProps = {
  resultsMarkdown: '',
};

export default CopyResultsButton;
