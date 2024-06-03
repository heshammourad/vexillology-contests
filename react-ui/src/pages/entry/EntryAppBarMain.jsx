/**
 * Entry-specific content for top app bar
 */
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import { useParams, useLocation, useOutletContext } from 'react-router-dom';

import {
  RouterLinkIconButton,
} from '../../components';

export default function EntryAppBarMain({ entryPosition, numberOfEntries }) {
  const { setScrollEntryId } = useOutletContext();
  const { state = {} } = useLocation();
  const { contestId, entryId } = useParams();

  return (
    <>
      <RouterLinkIconButton
        color="inherit"
        onClick={() => setScrollEntryId(entryId)}
        state={{
          back: state?.back,
        }}
        to={`/contests/${contestId}`}
        icon="close"
      />
      {!!entryPosition && !!numberOfEntries && (
      <Typography sx={{ paddingLeft: 2 }}>
        Flag
        {' '}
        {entryPosition}
        {' '}
        of
        {' '}
        {numberOfEntries}
      </Typography>
      )}
    </>
  );
}

EntryAppBarMain.propTypes = {
  entryPosition: PropTypes.number,
  numberOfEntries: PropTypes.number,
};

EntryAppBarMain.defaultProps = {
  entryPosition: undefined,
  numberOfEntries: undefined,
};
