/**
 * Voting and winners
 */

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import {
  useCategoryLabelStyles,
} from '../../common';
import { LABEL_COLORS } from '../../common/styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const CATEGORY_MENU_PROPS = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } },
};
const FILTER_CATEGORIES_LABEL_ID = 'filter-categories-label';

const useStyles = makeStyles((theme) => ({
  categories: {
    alignItems: 'center',
    columnGap: 8,
    display: 'flex',
    marginBottom: 16,
    maxWidth: 600,
    minHeight: 50,
    minWidth: 120,
  },
  categoryChip: {
    margin: 2,
  },
  categoryLabel: {
    borderRadius: 4,
    display: 'inline',
    padding: '0 4px',
  },
  selectedCategory: {
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

function ContestCategorySelector({
  setSelectedCategories,
  categories,
  selectedCategories,
}) {
  const handleCategoryChange = (event) => {
    setSelectedCategories(event.target.value.sort());
  };

  const resetSelectedCategories = () => {
    setSelectedCategories([]);
  };

  const classes = useStyles();
  const categoryLabelClasses = useCategoryLabelStyles();

  if (!categories.length) {
    return null;
  }

  return (
    <div className={classes.categories}>
      <Typography id={FILTER_CATEGORIES_LABEL_ID} variant="caption">
        Filter categories:
      </Typography>
      <Select
        input={<Input />}
        labelId={FILTER_CATEGORIES_LABEL_ID}
        MenuProps={CATEGORY_MENU_PROPS}
        multiple
        onChange={handleCategoryChange}
        renderValue={(selected) => (
          <Box display="flex" flexWrap="wrap">
            {selected.map((value) => (
              <Chip
                className={clsx(
                  classes.categoryChip,
                  categoryLabelClasses[
                  // eslint-disable-next-line indent
                  `label${categories.indexOf(value) % LABEL_COLORS.length}`
                  ],
                )}
                key={value}
                label={value}
              />
            ))}
          </Box>
        )}
        value={selectedCategories}
      >
        {categories.map((category, index) => (
          <MenuItem
            className={clsx({
              [classes.selectedCategory]: selectedCategories.includes(category),
            })}
            key={category}
            value={category}
          >
            <div
              className={clsx(
                classes.categoryLabel,
                categoryLabelClasses[`label${index % LABEL_COLORS.length}`],
              )}
            >
              {category}
            </div>
          </MenuItem>
        ))}
      </Select>
      <Button
        color="primary"
        disabled={!selectedCategories.length}
        size="small"
        onClick={resetSelectedCategories}
      >
        Reset
      </Button>
    </div>
  );
}

ContestCategorySelector.propTypes = {
  setSelectedCategories: PropTypes.func,
  categories: PropTypes.arrayOf(PropTypes.string),
  selectedCategories: PropTypes.arrayOf(PropTypes.string)
};

ContestCategorySelector.defaultProps = {
  setSelectedCategories: () => { },
  categories: [],
  selectedCategories: [],
};

export default ContestCategorySelector;
