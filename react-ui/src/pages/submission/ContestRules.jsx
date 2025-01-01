// TODO: Remove when deleting index files
/* eslint-disable no-restricted-imports */
import Dialog from '@material-ui/core/Dialog';
import { makeStyles } from '@material-ui/core/styles';

import Header from '../../components/Header';
import PageContainer from '../../components/PageContainer';
import StaticContent from '../../components/StaticContent';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
  },
}));

function ContestRules() {
  const classes = useStyles();
  return (
    <Dialog fullScreen open>
      <Header position="static" to="/submission">
        Contest Rules
      </Header>
      <PageContainer className={classes.container} maxWidth="md">
        <StaticContent id="contest_rules" />
      </PageContainer>
    </Dialog>
  );
}

export default ContestRules;
