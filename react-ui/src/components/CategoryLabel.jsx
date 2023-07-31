/**
 * Display entry category (if applicable)
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

import { getLabelColor } from '../common/styles';

function CategoryLabel({ categories, category, categoryRank }) {
  return (
    <div>
      <Box
        sx={{
          borderRadius: 1,
          display: 'inline',
          p: '0 4px',
          ...getLabelColor(categories.indexOf(category)),
        }}
      >
        <Typography variant="caption">
          {categoryRank && (
            <span>
              {`#${categoryRank}`}
              &nbsp;
            </span>
          )}
          {category}
        </Typography>
      </Box>
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
