/**
 * Site-wide settings
 */

import { makeStyles } from '@material-ui/core/styles';
import { useLocation } from 'react-router-dom';

import {
  ContestRemindersAlert,
  Header,
  PageContainer,
  ProtectedRoute,
} from '../../components';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 24,
  },
  content: {
    borderBottom: `1px solid ${theme.palette.grey.A100}`,
    margin: '0 auto 24px',
    maxWidth: 640,
  },
}));

function Settings() {
  const { state } = useLocation();

  const classes = useStyles();
  return (
    <>
      <Header position="static" to={state?.back ?? '/home'}>
        Settings
      </Header>
      <PageContainer className={classes.container}>
        <ProtectedRoute>
          <div className={classes.content}>
            <ContestRemindersAlert />
          </div>
        </ProtectedRoute>
      </PageContainer>
    </>
  );
}

export default Settings;
