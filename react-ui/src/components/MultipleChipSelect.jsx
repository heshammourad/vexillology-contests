import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useId } from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: 'center',
    columnGap: theme.spacing(1),
    display: 'flex',
    minHeight: 50,
    minWidth: 120,
  },
}));

function MultipleChipSelect({ className, label }) {
  const labelId = useId();
  const classes = useStyles();
  return (
    <div className={clsx(classes.root, className)}>
      <Typography id={labelId} variant="caption">
        {label}
        :
      </Typography>
    </div>
  );
}

MultipleChipSelect.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
};

MultipleChipSelect.defaultProps = {
  className: undefined,
};

export default MultipleChipSelect;
