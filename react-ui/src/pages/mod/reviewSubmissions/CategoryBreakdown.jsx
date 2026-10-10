import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    '& > *': {
      marginRight: theme.spacing(3),
    },
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
  const breakdown = categories
    .map((category) => ({
      category,
      count: approvedCategoryCounts[category] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  return (
    <div className={classes.root}>
      <Typography component="h2" variant="subtitle2">
        Approved by category
      </Typography>
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
