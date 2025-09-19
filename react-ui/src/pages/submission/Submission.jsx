/**
 * User submission portal
 */

import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import countdownTypes from '../../common/countdownTypes';
import {
  Countdown,
  Header,
  InternalLink,
  PageContainer,
  TabPanel,
} from '../../components';
import useSwrSubmission from '../../data/useSwrSubmission';

import SubmissionForm from './SubmissionForm';
import SubmissionManage from './SubmissionManage';
import SubmissionPrompt from './SubmissionPrompt';
import SubmissionTabs from './SubmissionTabs';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(2),
  },
  header: {
    alignItems: 'center',
    columnGap: theme.spacing(2),
    display: 'flex',
    marginRight: theme.spacing(2),
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    marginBottom: theme.spacing(2),
  },
}));

function Submission() {
  // ??? Pass in to submission form or not?
  const {
    data: {
      id: contestId,
      name: contestName,
      prompt,
      submissionEnd,
      submissions = [],
    },
    // error,
    isLoading,
  } = useSwrSubmission();
  // useSWRMutation shares cache store with useSWR to avoid race conditions

  const { state } = useLocation();
  const [selectedTab, setSelectedTab] = useState(state?.defaultTab ?? 0);
  const [previewDescription, setPreviewDescription] = useState(false);
  // const [submissionExpired, setSubmissionExpired] = useState(false);

  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
    setPreviewDescription(false);
  };

  const handleSubmissionExpiry = () => {
    // setSubmissionExpired(true);
  };

  // const submissionEndDate = parseISO(submissionEnd);
  // DO_NOT_SUBMIT to master: Overriding submission allowed to allow submission after the deadline.
  const submissionAllowed = true;

  const noData = isLoading ? (
    <CircularProgress />
  ) : (
    <div>The submission portal is not yet open. Please check again later.</div>
  );

  const classes = useStyles();
  return (
    <>
      <Header className={classes.header} position="static" to="/home">
        <div>Contest Submission</div>
        {submissionEnd && (
          <Countdown
            endDate={new Date(submissionEnd)}
            handleExpiry={handleSubmissionExpiry}
            variant={countdownTypes.SUBMISSION}
          />
        )}
      </Header>
      <PageContainer className={classes.container}>
        {contestId ? (
          <>
            <Typography className={classes.title} component="h1" variant="h6">
              {contestName}
            </Typography>
            {submissionAllowed ? (
              <Container maxWidth="md">
                <SubmissionTabs {...{ handleTabChange, selectedTab }} />

                <TabPanel currentTab={selectedTab} index={0}>
                  <SubmissionPrompt {...{ contestId, prompt }} />
                </TabPanel>
                <TabPanel currentTab={selectedTab} index={1}>
                  <SubmissionForm
                    {...{
                      previewDescription,
                      setPreviewDescription,
                      setSelectedTab,
                      submissionExpired: false,
                    }}
                  />
                </TabPanel>

                <TabPanel currentTab={selectedTab} index={2}>
                  <SubmissionManage {...{ handleTabChange, submissions }} />
                </TabPanel>
              </Container>
            ) : (
              <div>
                The submission window for this contest has closed. Click&nbsp;
                <InternalLink to={`/contests/${contestId}`}>here</InternalLink>
                &nbsp;to view entries.
              </div>
            )}
          </>
        ) : (
          noData
        )}
      </PageContainer>
    </>
  );
}

export default Submission;
