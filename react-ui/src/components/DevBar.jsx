/**
 * Banner to notify developer of overrides in env.js
 * ??? ideally this would be top of document, but fighting with AppBar/Toolbar
 */

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { putData } from '../api';
import { useAuthState } from '../common';
import { IS_DEV_BAR, START_WITHOUT_CACHE } from '../env';
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
      window.location.reload();
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
        backgroundColor: 'lightgrey',
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
              <Button color={isModerator ? 'success' : 'error'} variant="contained" onClick={toggleMod}>
                {isModerator ? 'ON' : 'OFF'}
              </Button>
            </>
          )
          : <Typography>Not logged in</Typography>
      }
      <Divider orientation="vertical" flexItem />
      <Typography>{START_WITHOUT_CACHE ? 'Cache OFF' : 'Cache ON'}</Typography>
      {/* <Button variant="contained" color={START_WITHOUT_CACHE ? 'error' : 'success'}>{START_WITHOUT_CACHE ? 'Cache OFF' : 'Cache ON'}</Button> */}
    </Stack>
  );
}

export default DevBar;
