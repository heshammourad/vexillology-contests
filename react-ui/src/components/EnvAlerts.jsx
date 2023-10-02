/**
 * Banner to notify developer of overrides in env.js
 * ??? ideally this would be top of document, but fighting with AppBar/Toolbar
 */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { IS_SUBMISSION_VIEW, IS_VOTING_VIEW } from '../env';

function EnvAlerts() {
  if (!IS_SUBMISSION_VIEW && !IS_VOTING_VIEW) {
    return null;
  }

  let text = '';
  if (IS_SUBMISSION_VIEW) {
    text = 'Submission override is on';
  } else if (IS_VOTING_VIEW) {
    text = 'Voting override is on';
  }

  return (
    <Box
      sx={{
        backgroundColor: 'violet',
        position: 'fixed',
        bottom: 0,
        width: '100%',
      }}
    >
      <Typography align="center">
        (DEV ONLY)
        {' '}
        {text}
      </Typography>
    </Box>
  );
}

export default EnvAlerts;
