/**
 * Banner to notify developer of overrides in env.js
 * ??? ideally this would be top of document, but fighting with AppBar/Toolbar
 */

import Button from '@material-ui/core/Button';
import { Typography } from '@mui/material';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import { putData } from '../api';
import { useAuthState } from '../common';
import { IS_DEV_BAR } from '../env';
import useSwrContest from '../utils/useSwrContest';
import useSwrInit from '../utils/useSwrInit';

const contestStatus = ['prerelease', 'submission', 'review', 'voting', 'results'];

function DevBar() {
  const { data, error, mutate: mutateContest } = useSwrContest('dev');
  const name = error?.data?.name || data?.name;
  const { data: { moderator: isModerator }, mutate: mutateMod } = useSwrInit();
  const [{ isLoggedIn, accessToken, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  if (!IS_DEV_BAR) {
    return null;
  }

  const setContest = async (status) => {
    try {
      await putData('/dev/contest', { status });
      mutateContest();
      // can you trigger data and or page refresh?
      return null;
    } catch (error) {
      return null;
    }
  };

  const toggleMod = async () => {
    try {
      await putData('/dev/mod', { moderator: !isModerator }, authTokens);
      mutateMod();
      return null;
    } catch (error) {
      return null;
    }
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        backgroundColor: 'violet',
        position: 'fixed',
        bottom: 0,
        width: '100%',
        padding: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {
        isLoggedIn
          ? (
            <>
              <Typography>Dev contest</Typography>
              {
                !!name && (
                  <>
                    {contestStatus.map((cId) => <Button variant={name === cId ? 'contained' : 'outlined'} onClick={() => setContest(cId)}>{cId}</Button>)}
                    <Divider orientation="vertical" flexItem light />
                  </>
                )
              }
              <Button variant="outlined" onClick={() => setContest('reset')}>{name ? 'Reset' : 'Create'}</Button>

              <Divider orientation="vertical" flexItem />
              <Typography>Mod mode</Typography>
              <Button variant={isModerator ? 'contained' : 'outlined'} onClick={toggleMod}>
                {isModerator ? 'ON' : 'OFF'}
              </Button>
            </>
          )
          : <Typography>Not logged in</Typography>
      }
    </Stack>
  );
}

export default DevBar;
