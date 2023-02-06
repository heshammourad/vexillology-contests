import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { CustomSwitch, Header, ProtectedRoute } from '../../components';

const useStyles = makeStyles((theme) => {
  const border = `1px solid ${theme.palette.grey.A100}`;
  return {
    container: {
      marginTop: 24,
    },
    content: {
      borderBottom: border,
      margin: '0 auto 24px',
      maxWidth: 640,
    },
    control: {
      alignItems: 'center',
      display: 'flex',
      flex: '0 0 auto',
      justifyContent: 'center',
      minWidth: 60,
    },
    labels: {
      color: theme.palette.grey.A700,
      flex: '1 1 auto',
      marginRight: 20,
      padding: '20px 0',
    },
    row: {
      display: 'flex',
      '&:not(:first-of-type)': {
        borderTop: border,
      },
    },
    title: {
      color: theme.palette.grey[800],
    },
  };
});

function Settings() {
  const classes = useStyles();
  return (
    <>
      <Header position="static" to="/home">
        Settings
      </Header>
      <Container className={classes.container}>
        <ProtectedRoute>
          <div className={classes.content}>
            <div className={classes.row}>
              <div className={classes.labels}>
                <Typography className={classes.title} component="div">
                  Contest reminders
                </Typography>
                <Typography component="div" variant="body2">
                  Receive reminders about the contest each month
                </Typography>
              </div>
              <div className={classes.control}>
                <CustomSwitch />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </Container>
    </>
  );
}

export default Settings;
