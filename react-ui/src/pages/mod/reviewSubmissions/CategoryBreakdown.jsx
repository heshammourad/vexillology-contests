import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import PropTypes from 'prop-types';

import snackbarTypes from '../../../common/snackbarTypes';
import useSnackbarState from '../../../common/useSnackbarState';

const useStyles = makeStyles((theme) => ({
  list: {
    margin: 0,
    paddingLeft: theme.spacing(3),
  },
  copyButton: {
    marginLeft: theme.spacing(1),
  },
  root: {
    marginBottom: theme.spacing(2),
  },
}));

/** Count of approved submissions in each contest category, highest count first.
 *
 * @param props
 * @param {string[]} categories - Contest categories.
 * @param {Object} approvedCategoryCounts - Number of approved submissions keyed by category.
 */
function CategoryBreakdown({ approvedCategoryCounts, categories }) {
  const classes = useStyles();
  const updateSnackbarState = useSnackbarState();
  const breakdown = categories
    .map((category) => ({
      category,
      count: approvedCategoryCounts[category] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  // Copies the breakdown as a Markdown list, for posting participant updates to Reddit
  const copyToClipboard = async () => {
    const markdown = breakdown
      .map(({ category, count }) => `- ${category}: ${count}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(markdown);
      updateSnackbarState(snackbarTypes.COPY_CATEGORY_BREAKDOWN_SUCCESS);
    } catch {
      updateSnackbarState(snackbarTypes.COPY_CATEGORY_BREAKDOWN_ERROR);
    }
  };

  return (
    <div className={classes.root}>
      <Box display="flex" alignItems="center">
        <Typography component="h2" variant="subtitle2">
          Approved by category
        </Typography>
        <Button
          className={classes.copyButton}
          color="primary"
          onClick={copyToClipboard}
          size="small"
          startIcon={<FileCopyIcon />}
        >
          Copy for Reddit
        </Button>
      </Box>
      <ul className={classes.list}>
        {breakdown.map(({ category, count }) => (
          <Typography key={category} component="li" variant="body2">
            {`${category}: ${count}`}
          </Typography>
        ))}
      </ul>
    </div>
  );
}

CategoryBreakdown.propTypes = {
  approvedCategoryCounts: PropTypes.objectOf(PropTypes.number),
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
};

CategoryBreakdown.defaultProps = {
  approvedCategoryCounts: {},
};

export default CategoryBreakdown;
