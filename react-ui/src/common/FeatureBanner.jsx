/**
 * Notify users of new features
 */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useMemo } from 'react';

/**
 * Enum of the available screens.
 * @typedef {'submission' | 'voting'} Screen
 */
const SCREENS = {
  HOME: 'home',
  SUBMISSION: 'submission',
  VOTING: 'voting',
};

/**
 * Array of features.
 * @type {Feature[]}
 * ------------
 * A feature list for a particular month
 * @typedef {Object} Feature
 * @property {string} month_year - The month and year when the feature was introduced.
 * @property {Bullet[]} bullets - An array of bullet points describing the feature details.
 * ------------
 * An individual feature
 * @typedef {Object} Bullet
 * @property {boolean} isBold - Indicates whether the bullet point should be displayed in bold.
 * @property {string} text - The text content of the bullet point.
 * @property {string[]} onScreens - An array of screens where the feature is applicable.
 */
const features = [
  // {
  //   monthYear: 'August 2023',
  //   bullets: [
  //     {
  //       text: 'This is a regular block of text that ideally should expand more than one line if I wrote this long enough. Hopefully. Ideally.',
  //       onScreens: [SCREENS.HOME, SCREENS.SUBMISSION],
  //     },
  //     {
  //       text: 'number 2',
  //       onScreens: [SCREENS.HOME, SCREENS.SUBMISSION],
  //     },
  //   ],
  // },
  // {
  //   monthYear: 'July 2023',
  //   bullets: [
  //     {
  //       isBold: false,
  //       text: 'This is an example bullet',
  //       onScreens: [SCREENS.HOME, SCREENS.SUBMISSION],
  //     },
  //     {
  //       isBold: false,
  //       text: 'Skip me',
  //       onScreens: [SCREENS.SUBMISSION],
  //     },
  //   ],
  // },
];

const useStyles = makeStyles((theme) => ({
  banner: {
    backgroundColor: theme.palette.primary.ultralight,
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
  },
  monthYear: {
    fontWeight: 'bold',
  },
  isBold: {
    fontWeight: 'bold',
  },
  bullet: {
    fontSize: '14px',
  },
}));

function FeatureBanner({ screen }) {
  const classes = useStyles();

  const Banner = useMemo(() => {
    // Reduce features to only months and bullets that relate to given screen
    const screenFeatures = features.reduce((acc, month) => {
      const screenBullets = month.bullets.filter((bullet) => bullet.onScreens.includes(screen));
      if (screenBullets.length) {
        return [...acc, {
          ...month, bullets: screenBullets,
        }];
      }
      return acc;
    }, []);

    if (!screenFeatures.length) {
      return null;
    }

    return (
      <Box className={classes.banner}>
        <Typography className={classes.monthYear}>NEW FEATURES</Typography>
        {
          screenFeatures.map(({ monthYear, bullets }) => (
            <div>
              <Typography className={classes.monthYear}>{monthYear}</Typography>
              {
                bullets.map(({ isBold = false, text }) => (
                  <Typography className={[classes.bullet, isBold && classes.isBold]}>
                    {'-  '}
                    {text}
                  </Typography>
                ))
              }
            </div>
          ))
        }
      </Box>
    );
  }, []);

  return Banner;
}

export { SCREENS, FeatureBanner };
