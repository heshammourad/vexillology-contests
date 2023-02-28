import { makeStyles } from '@material-ui/core/styles';

import { LABEL_COLORS } from './styles';

const useCategoryLabelStyles = makeStyles(
  LABEL_COLORS.reduce((acc, cur, idx) => {
    acc[`label${idx}`] = cur;
    return acc;
  }, {}),
);

export default useCategoryLabelStyles;
