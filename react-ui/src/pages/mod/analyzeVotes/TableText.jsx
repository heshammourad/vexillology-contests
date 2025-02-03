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

const RED_ABOVE_SCORE = 70;
const RED = 0;
const PURPLE = 275;
const MIN_LIGHTNESS = 30;
const MAX_LIGHTNESS = 50;
const MIN_DARK_HUE = 80;
const MAX_DARK_HUE = 160;
const HUE_GRADIENT_DISTANCE = 40;

function getHueFromScore(value) {
  return value > RED_ABOVE_SCORE
    ? RED
    : (RED_ABOVE_SCORE - value) * (PURPLE / RED_ABOVE_SCORE);
}

/**
 * 0 = red; 275 = purple
 * @param {*} hue
 * @returns
 */
function getColorFromHue(hue) {
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
        color: getColorFromHue(getHueFromScore(children)),
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

function EntryStatusTableText({ entryStatus }) {
  if (entryStatus === 'dq') {
    return <RedTableText>DQ</RedTableText>;
  }
  return <BlackTableText />;
}

export {
  BlackTableText,
  RedTableText,
  OrangeTableText,
  GreyTableText,
  ScoreTableText,
  BanStatusTableText,
  VoteStatusTableText,
  EntryStatusTableText,
  getColorFromHue,
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

EntryStatusTableText.propTypes = {
  entryStatus: PropTypes.oneOf(['dq']),
};

EntryStatusTableText.defaultProps = {
  entryStatus: undefined,
};
