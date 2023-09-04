/**
 * Entry-specific content for top app bar
 */
import { useParams, useLocation, useOutletContext } from 'react-router-dom';

import {
  ArrowBackButton,
} from '../../components';

export default function EntryAppBarMain() {
  const { setEntryId: shareEntryWithContest } = useOutletContext();
  const { state = {} } = useLocation();
  const { contestId, entryId } = useParams();

  return (
    <ArrowBackButton
      color="inherit"
      onClick={() => shareEntryWithContest(entryId)}
      state={{
        back: state?.back,
      }}
      to={`/contests/${contestId}`}
      icon="close"
    />
  );
}
