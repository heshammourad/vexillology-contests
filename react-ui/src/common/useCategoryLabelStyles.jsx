import makeStyles from '@mui/styles/makeStyles';

import { LABEL_COLORS } from './styles';

const useCategoryLabelStyles = makeStyles(
  LABEL_COLORS.reduce((acc, cur, idx) => {
    acc[`label${idx}`] = cur;
    return acc;
  }, {}),
);

export default useCategoryLabelStyles;
