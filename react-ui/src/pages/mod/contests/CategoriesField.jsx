import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useState } from 'react';

/**
 * A contest's categories as removable chips. A category that already has submissions
 * (`used`) can't be removed.
 */
function CategoriesField({ categories, onChange }) {
  const [newCategory, setNewCategory] = useState('');

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.some(({ category }) => category === trimmed)) {
      return;
    }
    onChange([...categories, { category: trimmed, used: false }]);
    setNewCategory('');
  };

  const removeCategory = (categoryToRemove) => {
    onChange(categories.filter(({ category }) => category !== categoryToRemove));
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Categories
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        {categories.map(({ category, used }) => (used ? (
          <Tooltip
            key={category}
            title="Can't remove: already used in a submission"
          >
            <Chip label={category} />
          </Tooltip>
        ) : (
          <Chip
            key={category}
            label={category}
            onDelete={() => removeCategory(category)}
          />
        )))}
      </Stack>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          label="New Category"
          size="small"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCategory();
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addCategory}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
}

CategoriesField.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      used: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CategoriesField;
