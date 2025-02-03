import Typography from '@material-ui/core/Typography';
import WarningIcon from '@mui/icons-material/Warning';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';

import { getColorFromHue } from './TableText';

function getHueFromBinary(isSuspicious) {
  return isSuspicious ? 0 : 275;
}

function BinaryText({ isSuspicious, children }) {
  const color = getColorFromHue(getHueFromBinary(isSuspicious));
  return (
    <Stack direction="row" spacing={1} sx={{ marginBottom: 1 }}>
      <WarningIcon sx={{ color, opacity: isSuspicious ? 1 : 0 }} />
      <Typography component="span" style={{ color, fontWeight: 'bolder' }}>
        {children}
      </Typography>
    </Stack>
  );
}

function AccountAgeText({ ageInDays }) {
  const isSuspicious = ageInDays < 60;
  return (
    <BinaryText isSuspicious={isSuspicious}>
      {`Voter is ${
        isSuspicious ? 'new' : 'old'
      } account (${ageInDays} days old)`}
    </BinaryText>
  );
}

export { AccountAgeText };

BinaryText.propTypes = {
  isSuspicious: PropTypes.bool.isRequired,
  children: PropTypes.string.isRequired,
};

AccountAgeText.propTypes = {
  ageInDays: PropTypes.number.isRequired,
};
