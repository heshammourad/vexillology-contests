import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useCategoryLabelStyles } from '../common';
import { LABEL_COLORS } from '../common/styles';

const useStyles = makeStyles({
  label: {
    borderRadius: 4,
    display: 'inline',
    padding: '0 4px',
  },
});

function CategoryLabel({ categories, category, categoryRank }) {
  const classes = useStyles();
  const categoryLabelClasses = useCategoryLabelStyles();
  return (
    <div>
      <div
        className={clsx(
          classes.label,
          categoryLabelClasses[`label${categories.indexOf(category) % LABEL_COLORS.length}`],
        )}
      >
        <Typography variant="caption">
          {categoryRank && <span>{`#${categoryRank} `}</span>}
          {category}
        </Typography>
      </div>
    </div>
  );
}

CategoryLabel.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  category: PropTypes.string.isRequired,
  categoryRank: PropTypes.string,
};

CategoryLabel.defaultProps = {
  categoryRank: null,
};

export default CategoryLabel;
