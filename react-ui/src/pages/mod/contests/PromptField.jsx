import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

import { ContestRulesLink, FormattedContent } from '../../../components';

/**
 * The contest prompt, with a preview of how the submission page will show it.
 */
function PromptField({ duplicateLinkWarnings, onChange, value }) {
  return (
    <Box>
      <TextField
        required
        label="Prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        multiline
        rows={12}
        placeholder="Enter contest prompt or theme..."
        helperText="Supports Reddit markdown."
        fullWidth
      />
      {duplicateLinkWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {`This prompt appears to contain ${duplicateLinkWarnings.join(
            ' and ',
          )}. `}
          The submission page already shows both below the prompt (see the
          preview), so consider removing them so they don&apos;t show up twice.
        </Alert>
      )}
      {value.trim() && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Preview
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormattedContent content={value} isMarkdown />
            <ContestRulesLink />
          </Paper>
        </Box>
      )}
    </Box>
  );
}

PromptField.propTypes = {
  // From getDuplicateLinkWarnings(value), which the form also needs on submit.
  duplicateLinkWarnings: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default PromptField;
