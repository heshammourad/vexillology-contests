import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {LABEL_COLORS} from '../../common/styles';

interface CategoryLabelProps {
  categories: string[];
  category: string;
  categoryRank?: string | null;
}

export default function CategoryLabel({
  categories,
  category,
  categoryRank = null,
}: CategoryLabelProps) {
  const index = categories.indexOf(category);
  const colorStyle =
    index !== -1
      ? LABEL_COLORS[index % LABEL_COLORS.length]
      : {backgroundColor: 'rgb(231, 231, 231)', color: 'rgb(70, 70, 70)'};

  return (
    <div>
      <Box
        sx={{
          borderRadius: 1, // 4px
          display: 'inline-block',
          padding: '0 4px',
          ...colorStyle,
        }}>
        <Typography variant="caption" component="span">
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
export type {CategoryLabelProps};
