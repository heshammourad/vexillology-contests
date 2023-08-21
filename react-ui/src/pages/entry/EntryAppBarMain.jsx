/**
 * Entry-specific content for top app bar
 */
import PropTypes from 'prop-types';
import { useParams, useLocation } from 'react-router-dom';

import { useScrollState, useSwrData } from '../../common';
import {
  ArrowBackButton,
} from '../../components';

export default function EntryAppBarMain({ entryId }) {
  const { state = {} } = useLocation();
  const [scroll, setScroll] = useScrollState();
  const { contestId } = useParams();
  const apiPath = `/contests/${contestId}`;
  const { data } = useSwrData(apiPath, false);

  const {
    requestId,
  } = data;

  return (
    <ArrowBackButton
      color="inherit"
      onClick={() => {
        setScroll({ ...scroll, entryId });
      }}
      state={{
        back: state?.back,
        requestId,
        selectedCategories: state?.selectedCategories ?? [],
      }}
      to={`/contests/${contestId}`}
      icon="close"
    />
  );
}

EntryAppBarMain.propTypes = {
  entryId: PropTypes.string,
};

EntryAppBarMain.defaultProps = {
  entryId: '',
};
