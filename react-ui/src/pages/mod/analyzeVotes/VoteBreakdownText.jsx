import Typography from '@material-ui/core/Typography';
import WarningIcon from '@mui/icons-material/Warning';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';

import { getColorFromValue } from './TableText';

const WEIGHTS = {
  age: 13,
  karma: 5,
  fives: 20,
  sabotage: 10,
  fit: 20,
  zero: 2,
  history: 30,
};

const RUBRIC = {
  // SUS: 0; OK: 4
  age: {
    getText: (ageInMonths) => {
      if (ageInMonths < 1) {
        return '<1 mo';
      }
      if (ageInMonths === 1) {
        return '1 mo';
      }
      if (ageInMonths < 12) {
        return `${ageInMonths} mos`;
      }
      return '>1 yr';
    },
    getScore: (ageInMonths) => Math.max(0, 100 - ageInMonths * 25),
    weight: WEIGHTS.age,
  },
  // SUS: 0; OK: 50
  karma: {
    getText: (karma) => (karma <= 100 ? `${karma} vote karma` : '>100 vote karma'),
    getScore: (karma) => Math.max(0, 100 - karma * 2),
    weight: WEIGHTS.karma,
  },
  fives: {
    getText: ([v1, v2, numberOfFlags]) => {
      const [vote1, vote2] = Number.isInteger(v1) ? [v1, v2] : [v2, v1];
      if (!vote1) {
        return 'Voter did not rate entrant';
      }
      if (numberOfFlags === 1) {
        return `Voter gave flag a ${vote1}`;
      }
      if (!vote2) {
        return `Voter gave flags ${vote1} and X`;
      }
      return `Voter gave flags ${vote1} and ${vote2}`;
    },
    getScore: ([v1, v2]) => {
      const [vote1, vote2] = Number.isInteger(v1) ? [v1, v2] : [v2, v1];
      if (!vote1) {
        return -1;
      }
      let sum = 0;
      let num = 0;
      if (Number.isInteger(vote1)) {
        sum += vote1;
        num += 1;
      }
      if (Number.isInteger(vote2)) {
        sum += vote2;
        num += 1;
      }
      let average = sum / num;
      if (!Number.isInteger(average)) {
        average = Math.round(average * 10) / 10;
      }
      if (average === 5) {
        return 100;
      }
      if (average === 4.5) {
        return 50;
      }
      if (average === 4) {
        return 20;
      }
      return 0;
    },
    weight: WEIGHTS.fives,
  },
  sabotage: {
    getText: () => {},
    getScore: () => {},
    weight: WEIGHTS.sabotage,
  },
  fit: {
    getText: () => {},
    getScore: () => {},
    weight: WEIGHTS.fit,
  },
  zero: {
    getText: (hasZero) => (hasZero ? 'Voted at least one zero' : 'No zeros'),
    getScore: (hasZero) => (hasZero ? 100 : 0),
    weight: WEIGHTS.zero,
  },
  history: {
    getText: ([fives, fours, below]) => {
      if (!fives && !fours && !below) {
        return 'Has not voted on this entrant';
      }
      if (fives && !fours && !below) {
        return `Only fives (${fives}/${fives})`;
      }
      if (fives && fours && !below) {
        const total = fives + fours;
        return `Only fives and fours (${total}/${total})`;
      }
      const percentage = Math.round(
        (100 * (fives + fours)) / (fives + fours + below),
      );
      return `${percentage}% fives and fours (${fives + fours}/${
        fives + fours + below
      })`;
    },
    getScore: ([fives, fours, below]) => {
      if (!fives && !fours && !below) {
        return -1;
      }
      if (fives && !fours && !below) {
        return 100;
      }
      if (fives && fours && !below) {
        return 90;
      }
      const percentage = Math.round(
        (100 * (fives + fours)) / (fives + fours + below),
      );
      return percentage * 0.8;
    },
    weight: WEIGHTS.history,
  },
};

// function BinaryText({ isSuspicious, children }) {
//   const color = getColorFromValue(isSuspicious, 0, 1);
//   return (
//     <Stack direction="row" spacing={1} sx={{ marginBottom: 1 }}>
//       <WarningIcon sx={{ color, opacity: isSuspicious ? 1 : 0 }} />
//       <Typography component="span" style={{ color, fontWeight: 'bolder' }}>
//         {children}
//       </Typography>
//     </Stack>
//   );
// }

// function AccountAgeText({ ageInDays }) {
//   const isSuspicious = ageInDays < 60;
//   return (
//     <BinaryText isSuspicious={isSuspicious}>
//       {`Voter is ${
//         isSuspicious ? 'new' : 'old'
//       } account (${ageInDays} days old)`}
//     </BinaryText>
//   );
// }

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

export { VoterBreakdownText, RUBRIC };

VoterBreakdownText.propTypes = {
  score: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
};
