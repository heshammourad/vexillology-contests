import Typography from '@material-ui/core/Typography';

import InternalLink from './InternalLink';

/**
 * The link to the contest rules shown under every contest prompt.
 */
function ContestRulesLink() {
  return (
    <InternalLink to="/submission/rules">
      <Typography component="span" variant="h6">
        Please read the contest rules in full before submitting.
      </Typography>
    </InternalLink>
  );
}

export default ContestRulesLink;
