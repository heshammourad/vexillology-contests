/**
 * Contest sponsor banner
 */

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import {
  ExternalLink, FmpIcon, FMP_LINK, FMP_TEXT,
} from '../../components';

const useStyles = makeStyles((theme) => ({
  sponsorBanner: {
    alignItems: 'center',
    backgroundColor: theme.palette.flagMakerPrint.main,
    color: theme.palette.common.white,
    columnGap: 8,
    display: 'flex',
    justifyContent: 'center',
    padding: 8,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  sponsorIcon: {
    fill: theme.palette.common.white,
    width: 24,
  },
}));

function ContestSponsor() {
  const classes = useStyles();

  return (
    <ExternalLink
      className={classes.sponsorBanner}
      href={FMP_LINK}
      target="_blank"
    >
      <FmpIcon className={classes.sponsorIcon} />
      <Typography component="span" variant="subtitle2">
        {FMP_TEXT}
      </Typography>
    </ExternalLink>
  );
}

export default ContestSponsor;
