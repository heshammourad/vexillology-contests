/**
 * Entry-specific content for top app bar
 */
import { useParams, useLocation } from 'react-router-dom';

import {
  ArrowBackButton,
} from '../../components';

export default function EntryAppBarMain() {
  const { state = {} } = useLocation();
  const { contestId } = useParams();

  return (
    <ArrowBackButton
      color="inherit"
      state={{
        back: state?.back,
        selectedCategories: state?.selectedCategories ?? [],
      }}
      to={`/contests/${contestId}`}
      icon="close"
    />
  );
}
