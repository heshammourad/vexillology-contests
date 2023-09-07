/**
 * Entry-specific content for top app bar
 */
import { useParams, useLocation, useOutletContext } from 'react-router-dom';

import {
  RouterLinkIconButton,
} from '../../components';

export default function EntryAppBarMain() {
  const { setEntryId: shareEntryWithContest } = useOutletContext();
  const { state = {} } = useLocation();
  const { contestId, entryId } = useParams();

  return (
    <RouterLinkIconButton
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
