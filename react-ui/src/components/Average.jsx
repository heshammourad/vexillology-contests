import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

function Average({ average, className, fullText }) {
  if (!average && average !== 0) {
    return null;
  }

  return (
    <Typography className={className} variant="subtitle2">
      {fullText ? 'Average rating' : 'Avg'}
      :&nbsp;
      {average}
    </Typography>
  );
}

Average.propTypes = {
  average: PropTypes.string,
  className: PropTypes.string,
  fullText: PropTypes.bool,
};

Average.defaultProps = {
  average: undefined,
  className: undefined,
  fullText: true,
};

export default Average;
