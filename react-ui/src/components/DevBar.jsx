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
import useContestId from '../utils/useContestId';
import useSwrInit from '../utils/useSwrInit';

const devContests = ['prerelease', 'review', 'voting', 'results'];

function DevBar() {
  const contestId = useContestId();
  const { data: { moderator: isModerator }, mutate: mutateMod } = useSwrInit();
  const [{ accessToken, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  if (!IS_DEV_BAR) {
    return null;
  }

  const reset = async () => {
    try {
      const res = await putData('/devReset', { test: true });
      console.log(res);
      // can you trigger data and or page refresh?
    } catch (error) {
      console.log(error);
      // what do you normally do here?
    }
  };

  const toggleMod = async () => {
    try {
      await putData('/devMod', { moderator: !isModerator }, authTokens);
      mutateMod();
    } catch (error) {
      console.log(error);
      // what do you normally do here?
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
      <Typography>Contests</Typography>
      {devContests.map((cId) => <Button variant={contestId === cId ? 'contained' : 'outlined'}>{cId}</Button>)}
      <Divider orientation="vertical" flexItem light />
      <Button variant="outlined" onClick={reset}>Reset</Button>

      <Divider orientation="vertical" flexItem />

      <Typography>Mod mode</Typography>
      <Button variant={isModerator ? 'contained' : 'outlined'} onClick={toggleMod}>
        {isModerator ? 'ON' : 'OFF'}
      </Button>
    </Stack>
  );
}

export default DevBar;
