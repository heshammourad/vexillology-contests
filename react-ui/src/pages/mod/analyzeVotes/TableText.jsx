import Typography from '@material-ui/core/Typography';
import WarningIcon from '@mui/icons-material/Warning';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import PropTypes from 'prop-types';

function RedTableText({ children }) {
  return (
    <TableCell
      style={{ color: '#EB0000', fontWeight: 'bolder', textAlign: 'center' }}
    >
      {children}
    </TableCell>
  );
}

function OrangeTableText({ children }) {
  return (
    <TableCell
      style={{ color: '#EB7D00', fontWeight: 'bolder', textAlign: 'center' }}
    >
      {children}
    </TableCell>
  );
}

function GreyTableText({ children }) {
  return (
    <TableCell
      style={{ color: '#898989', fontWeight: 'bolder', textAlign: 'center' }}
    >
      {children}
    </TableCell>
  );
}

function TableTextWrapper({ loading, error, children }) {
  if (loading) {
    return (
      <TableCell style={{ fontStyle: 'italic', color: '#898989' }}>
        Loading...
      </TableCell>
    );
  }

  if (error) {
    return <RedTableText>ERROR</RedTableText>;
  }

  return children;
}

const RED_ABOVE_VALUE = 70;
const PURPLE_BELOW_VALUE = 0;
const RED = 0;
const PURPLE = 275;
const MIN_LIGHTNESS = 30;
const MAX_LIGHTNESS = 50;
const MIN_DARK_HUE = 80;
const MAX_DARK_HUE = 160;
const HUE_GRADIENT_DISTANCE = 40;

/**
 * 0 = red; 275 = purple
 * @param {*} hue
 * @returns
 */
function getColorFromValue(
  value,
  redAboveValue = RED_ABOVE_VALUE,
  purpleBelowValue = PURPLE_BELOW_VALUE,
) {
  if (value < 0) {
    return 'hsl(0, 0%, 50%)';
  }

  let hue;
  if (value >= redAboveValue) {
    hue = RED;
  } else if (value <= purpleBelowValue) {
    hue = PURPLE;
  } else {
    hue = (redAboveValue - value) * (PURPLE / redAboveValue);
  }

  // Map score onto HSL color wheel
  // 70+ = red; 0 = purple
  // Lowers brightness of yellows, greens, and teals
  let lightness;
  if (hue >= MIN_DARK_HUE && hue <= MAX_DARK_HUE) {
    lightness = MIN_LIGHTNESS;
  } else if (
    hue >= MIN_DARK_HUE - HUE_GRADIENT_DISTANCE
    && hue <= MAX_DARK_HUE + HUE_GRADIENT_DISTANCE
  ) {
    const distanceFromDarkHue = hue < MIN_DARK_HUE ? MIN_DARK_HUE - hue : hue - MAX_DARK_HUE;
    // distanceFromDarkHue / (mapping hue distance to lightness distance)
    lightness = MIN_LIGHTNESS
      + distanceFromDarkHue
        / (HUE_GRADIENT_DISTANCE / (MAX_LIGHTNESS - MIN_LIGHTNESS));
  } else {
    lightness = MAX_LIGHTNESS; // Default lightness for other colors
  }

  return `hsl(${hue}, 100%, ${lightness}%)`; // Full saturation, medium lightness
}
function ScoreTableText({ children }) {
  if (!children) {
    return (
      <BlackTableText bold center>
        -
      </BlackTableText>
    );
  }
  return (
    <TableCell
      style={{
        color: getColorFromValue(children),
        fontWeight: 'bolder',
        textAlign: 'center',
      }}
    >
      {children}
    </TableCell>
  );
}

function BlackTableText({ bold, center, children }) {
  return (
    <TableCell
      style={{
        fontWeight: bold ? 'bolder' : 'normal',
        textAlign: center ? 'center' : 'left',
      }}
    >
      {children}
    </TableCell>
  );
}

function BanStatusTableText({ banStatus }) {
  if (banStatus === 'ban') {
    return <RedTableText>BANNED</RedTableText>;
  }
  if (banStatus === 'warn') {
    return <OrangeTableText>WARNED</OrangeTableText>;
  }
  return <BlackTableText />;
}

function VoteStatusTableText({ voteStatus }) {
  if (voteStatus === 'exclude') {
    return <RedTableText>EXCLUDE</RedTableText>;
  }
  if (voteStatus === 'autofilter') {
    return <GreyTableText>AUTOFILTER</GreyTableText>;
  }
  return <BlackTableText />;
}

function EntriesStatusTableText({ entries }) {
  const dqs = entries.reduce((acc, curr) => acc + (curr.dq ? 1 : 0), 0);
  if (dqs) {
    return <RedTableText>{`${dqs}/${entries.length}`}</RedTableText>;
  }
  return <BlackTableText />;
}

function VoterBreakdownText({ text, score }) {
  const color = getColorFromValue(score);
  return (
    <Stack direction="row" spacing={1} sx={{ marginTop: 1, marginBottom: 2 }}>
      <WarningIcon sx={{ color, opacity: score / 100 }} />
      <Typography component="span" style={{ color, fontWeight: 'bolder' }}>
        {text}
      </Typography>
    </Stack>
  );
}

export {};

VoterBreakdownText.propTypes = {
  score: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
};

export {
  VoterBreakdownText,
  BlackTableText,
  RedTableText,
  OrangeTableText,
  GreyTableText,
  ScoreTableText,
  BanStatusTableText,
  VoteStatusTableText,
  EntriesStatusTableText,
  TableTextWrapper,
  getColorFromValue,
};

RedTableText.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

OrangeTableText.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

GreyTableText.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

TableTextWrapper.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  children: PropTypes.node,
};

TableTextWrapper.defaultProps = {
  loading: false,
  error: null,
  children: null,
};

ScoreTableText.propTypes = {
  children: PropTypes.number,
};

BlackTableText.propTypes = {
  bold: PropTypes.bool,
  center: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

BlackTableText.defaultProps = {
  bold: false,
  center: false,
  children: null,
};

ScoreTableText.defaultProps = {
  children: undefined,
};

BanStatusTableText.propTypes = {
  banStatus: PropTypes.oneOf(['ban', 'warn', '']),
};

BanStatusTableText.defaultProps = {
  banStatus: undefined,
};

VoteStatusTableText.propTypes = {
  voteStatus: PropTypes.oneOf(['exclude', 'autofilter', '']),
};

VoteStatusTableText.defaultProps = {
  voteStatus: undefined,
};

EntriesStatusTableText.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      entryId: PropTypes.string.isRequired,
      dq: PropTypes.bool.isRequired,
    }),
  ).isRequired,
};
