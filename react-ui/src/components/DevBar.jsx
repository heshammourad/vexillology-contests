/**
 * Banner to notify developer of overrides in env.js
 */

import { Toolbar } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

import { putData } from '../api';
import { useAuthState } from '../common';
import { IS_DEV_BAR, START_WITHOUT_CACHE } from '../env';
import useSwrContest from '../utils/useSwrContest';
import useSwrInit from '../utils/useSwrInit';

const contestStatus = ['prerelease', 'submission', 'review', 'voting', 'results'];

function DevBar() {
  const { data, error, mutate: mutateContest } = useSwrContest('dev');
  const navigate = useNavigate();
  const name = error?.data?.name || data?.name;
  const { data: { moderator: isModerator }, mutate: mutateMod } = useSwrInit();
  const [{ authTokens, isLoggedIn }] = useAuthState();

  if (!IS_DEV_BAR) {
    return null;
  }

  const setContest = async (status) => {
    try {
      await putData('/dev/contest', { status }, authTokens);
      mutateContest();
      navigate('/contests/dev', { replace: true });
      return null;
    } catch (e) {
      return null;
    }
  };

  const toggleMod = async () => {
    try {
      await putData('/dev/mod', { moderator: !isModerator }, authTokens);
      mutateMod();
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <Toolbar
      variant="dense"
      sx={{
        backgroundColor: 'lightgrey',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          backgroundColor: 'lightgrey',
          flex: 1,
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
                      {contestStatus.map((cId) => (
                        <Button
                          key={cId}
                          variant={name === cId ? 'contained' : 'outlined'}
                          onClick={() => setContest(cId)}
                        >
                          {cId}
                        </Button>
                      ))}
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
      </Stack>
    </Toolbar>
  );
}

export default DevBar;
