import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import isFuture from 'date-fns/isFuture';
import parseISO from 'date-fns/parseISO';
import debounce from 'lodash/debounce';
import pluralize from 'pluralize';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { postData } from '../../api';
import {
  uploadFile,
  useAuthState,
  useFormState,
  useSnackbarState,
  useSwrData,
  useSwrMutation,
} from '../../common';
import countdownTypes from '../../common/countdownTypes';
import snackbarTypes from '../../common/snackbarTypes';
import {
  Countdown,
  Fieldset,
  ExternalLink,
  Header,
  InternalLink,
  PageContainer,
  ProtectedRoute,
  RedditMarkdown,
  SpinnerButton,
  SubmissionsTable,
  TabPanel,
} from '../../components';

import ComplianceCheckbox from './ComplianceCheckbox';
import May23 from './content/May23';

const API_PATH = '/submission';
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const useStyles = makeStyles((theme) => ({
  chooseFileButton: {
    flexShrink: 1,
    height: 56,
  },
  complianceCheckboxes: {
    rowGap: theme.spacing(1),
  },
  complianceLegend: {
    color: theme.palette.text.primary,
  },
  container: {
    marginTop: theme.spacing(2),
  },
  currentSubmissions: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing(2),
  },
  descriptionEntry: {
    display: 'none',
  },
  descriptionField: {
    width: '100%',
  },
  descriptionPreview: {
    height: 114,
    margin: '27px 12px 10px',
    overflowY: 'auto',
    position: 'absolute',
    top: 0,
    width: 'calc(100% - 24px)',
    zIndex: 10,
  },
  descriptionWrapper: {
    position: 'relative',
  },
  file: {
    columnGap: theme.spacing(2),
    display: 'flex',
  },
  fileInput: {
    clip: 'rect(1px, 1px, 1px, 1px)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
  fileName: {
    flexGrow: 1,
  },
  flagPreview: {
    visibility: 'hidden',
  },
  flagPreviewActive: {
    display: 'block',
    maxHeight: 300,
    maxWidth: '100%',
    objectFit: 'scale-down',
    visibility: 'visible',
  },
  flagPreviewContainer: {
    maxHeight: 300,
    width: 'fit-content',
  },
  flagPreviewContainerEmpty: {
    height: '50vw',
    maxHeight: 300,
    maxWidth: 600,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    columnGap: theme.spacing(2),
    display: 'flex',
    marginRight: theme.spacing(2),
    justifyContent: 'space-between',
    width: '100%',
  },
  previewDescription: {
    '& textarea': {
      visibility: 'hidden',
    },
  },
  previewDescriptionButton: {
    alignSelf: 'flex-start',
  },
  submitAnotherButton: {
    marginLeft: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
}));

const fileReader = new FileReader();

function Submission() {
  const {
    data: {
      categories,
      firebaseToken,
      id: contestId,
      name: contestName,
      prompt,
      submissionEnd,
      submissions = [],
    },
    error,
  } = useSwrData(API_PATH);
  const { isMutating, trigger } = useSwrMutation(API_PATH, postData);

  const [formState, updateFormState, resetFormState] = useFormState([
    'name',
    'category',
    'file',
    'description',
    'complianceOriginalDesign',
    'complianceAuthorshipAnonymous',
    'complianceEffort',
    'complianceOriginalArt',
    'complianceNsfwFree',
    'complianceFlatFlag',
  ]);
  const [{ username }] = useAuthState();
  const { state } = useLocation();
  const updateSnackbarState = useSnackbarState();
  const [selectedTab, setSelectedTab] = useState(state?.defaultTab ?? 0);
  const [fileDimensions, setFileDimensions] = useState(null);
  const [previewDescription, setPreviewDescription] = useState(false);
  const [submissionExpired, setSubmissionExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const fileNameRef = useRef(null);
  const flagPreviewRef = useRef(null);

  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
    setPreviewDescription(false);
  };

  const switchToSubmissionFormTab = () => {
    setSelectedTab(1);
  };

  const updateError = (field, value) => {
    updateFormState(field, 'error', value);
  };

  const validateForm = (submit = false) => {
    let errorField = null;

    const fieldsToValidate = Object.keys(formState).filter(
      (field) => submit || formState[field].touch,
    );
    fieldsToValidate.forEach((field) => {
      let errorValue = null;
      switch (field) {
        case 'category':
          if (!categories.length) {
            break;
          }
        // Fall through
        case 'description':
        case 'name':
          errorValue = formState[field].value ? null : 'This is a required question';
          break;
        default:
          // DO NOTHING
          break;
      }
      updateError(field, errorValue);
      if (!errorField && errorValue) {
        errorField = field;
      }
    });

    if (submit && errorField) {
      document.getElementById(errorField).focus();
    }

    return !errorField;
  };

  const validateFormDebounced = debounce(
    () => {
      validateForm();
    },
    100,
    { leading: true },
  );

  fileReader.onload = ({ target: { result } }) => {
    flagPreviewRef.current.setAttribute('src', result);
  };

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
    updateFormState('file', 'value', null);
    flagPreviewRef.current.setAttribute('src', null);
    setFileDimensions(null);
  };

  const updateFile = ({
    target: {
      files: [inputFile],
    },
  }) => {
    clearFile();

    const [type, subtype] = inputFile.type.split('/');
    if (type !== 'image' || !['jpeg', 'png'].includes(subtype)) {
      updateError('file', 'Must select an a JPEG or PNG image');
      return;
    }

    if (inputFile.size > MAX_FILE_SIZE) {
      updateError('file', 'File size cannot exceed 1MB');
      return;
    }

    fileReader.readAsDataURL(inputFile);
    updateError('file', null);
    updateFormState('file', 'value', inputFile);
  };

  const handleFieldBlur = ({ target: { id, name } }) => {
    const field = id ?? name;
    updateFormState(field, 'focus', false);
    updateFormState(field, 'touch', true);
    validateFormDebounced();
  };

  const handleFieldChange = ({
    target: {
      checked, id, name, value,
    },
  }) => {
    const field = id ?? name;
    updateFormState(field, 'value', field.startsWith('compliance') ? checked : value);
    validateFormDebounced();
  };

  const handleImageLoad = ({ target: { naturalHeight, naturalWidth } }) => {
    if (naturalHeight > 3000 || naturalWidth > 3000) {
      clearFile();
      updateError('file', 'Image dimensions cannot be more than 3000px');
      return;
    }
    setFileDimensions({ height: naturalHeight, width: naturalWidth });
  };

  const handlePreviewDescriptionClick = () => {
    setPreviewDescription(!previewDescription);
  };

  const getComplianceError = (submit = false) => {
    const complianceFields = Object.keys(formState).filter(
      (field) => field.startsWith('compliance') && (submit || formState[field].touch),
    );
    return complianceFields.some((field) => {
      const { value } = formState[field];
      return !value;
    });
  };

  const resetForm = () => {
    resetFormState();
    setFileDimensions(null);
    setPreviewDescription(false);
  };

  const submitForm = async () => {
    let errorSubmitting = false;
    try {
      setSubmitting(true);

      Object.keys(formState).forEach((field) => {
        updateFormState(field, 'touch', true);
      });

      const validForm = validateForm(true) && !getComplianceError(true);

      const filePresent = !!formState.file.value;
      if (!filePresent) {
        updateError('file', 'Must choose file');
        if (validForm) {
          fileNameRef.current.scrollIntoView();
        }
      }

      if (!validForm || !filePresent) {
        return;
      }

      const downloadUrl = await uploadFile(firebaseToken, formState.file.value);
      if (!downloadUrl) {
        errorSubmitting = true;
        return;
      }

      const payload = {
        contestId,
        description: formState.description.value,
        height: fileDimensions.height,
        name: formState.name.value,
        url: downloadUrl,
        width: fileDimensions.width,
      };
      if (formState.category.value) {
        payload.category = formState.category.value;
      }

      trigger(payload, {
        revalidate: false,
        populateCache: (response, data) => {
          if (!response) {
            errorSubmitting = true;
            return data;
          }

          updateSnackbarState(snackbarTypes.SUBMISSION_SUCCESS);
          resetForm();
          setSelectedTab(2);
          return { ...data, submissions: response.data };
        },
        onError: () => {
          errorSubmitting = true;
        },
      });
    } catch {
      errorSubmitting = true;
    } finally {
      if (errorSubmitting) {
        updateSnackbarState(snackbarTypes.SUBMISSION_ERROR);
      }
      setSubmitting(false);
    }
  };

  const handleSubmissionExpiry = () => {
    setSubmissionExpired(true);
  };

  const submissionEndDate = parseISO(submissionEnd);
  const submissionAllowed = isFuture(submissionEndDate);
  const disableSubmitting = submitting || isMutating;

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
        {error?.status === 404 && (
          <div>The submission portal is not yet open. Please check again later.</div>
        )}
        {contestId && (
          <>
            <Typography className={classes.title} component="h1" variant="h6">
              {contestName}
            </Typography>
            {submissionAllowed ? (
              <Container maxWidth="md">
                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                >
                  <Tab id="tab-0" label="Contest Prompt" aria-controls="tabpanel-0" />
                  <Tab id="tab-1" label="Submission Form" aria-controls="tabpanel-1" />
                  <Tab id="tab-2" label="Current Submissions" aria-controls="tabpanel-2" />
                </Tabs>
                <TabPanel currentTab={selectedTab} index={0}>
                  {contestId === 'may23' ? <May23 /> : <RedditMarkdown text={prompt} />}
                </TabPanel>
                <TabPanel currentTab={selectedTab} index={1}>
                  <ProtectedRoute
                    message="You must log in with Reddit to submit a flag"
                    showCancel={false}
                  >
                    <form id="submission-form">
                      <Fieldset disabled={disableSubmitting || submissionExpired}>
                        <TextField
                          id="username"
                          variant="filled"
                          label="Username"
                          disabled
                          value={username}
                        />
                        <TextField
                          id="name"
                          name="name"
                          color="secondary"
                          variant="filled"
                          helperText={formState.name.error || 'A concise name for your flag'}
                          label="Flag Name"
                          required
                          error={!!formState.name.error}
                          value={formState.name.value}
                          onBlur={handleFieldBlur}
                          onChange={handleFieldChange}
                        />
                        <div className={classes.file}>
                          <input
                            ref={fileInputRef}
                            className={classes.fileInput}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={updateFile}
                          />
                          <TextField
                            id="fileName"
                            ref={fileNameRef}
                            className={classes.fileName}
                            variant="filled"
                            disabled
                            label="Upload File"
                            required
                            InputProps={{ readOnly: true }}
                            value={formState.file.value?.name ?? ''}
                            error={!!formState.file.error}
                            helperText={
                              formState.file.error
                              || 'Upload a JPEG or PNG image (1MB max filesize)'
                            }
                          />
                          <Button
                            className={classes.chooseFileButton}
                            color="secondary"
                            onClick={openFilePicker}
                          >
                            Choose file
                          </Button>
                        </div>
                        <div>
                          <Typography variant="caption">Preview</Typography>
                          <Paper
                            className={clsx(classes.flagPreviewContainer, {
                              [classes.flagPreviewContainerEmpty]: !formState.file.value,
                            })}
                            elevation={0}
                            variant="outlined"
                          >
                            <img
                              id="flag-preview"
                              ref={flagPreviewRef}
                              alt=""
                              className={clsx(classes.flagPreview, {
                                [classes.flagPreviewActive]:
                                  !!formState.file.value && !!fileDimensions?.width,
                              })}
                              onLoad={handleImageLoad}
                            />
                          </Paper>
                        </div>
                        {!!categories.length && (
                          <TextField
                            id="category"
                            name="category"
                            select
                            color="secondary"
                            variant="filled"
                            label="Category"
                            required
                            helperText={formState.category.error}
                            error={!!formState.category.error}
                            value={formState.category.value}
                            onBlur={handleFieldBlur}
                            onChange={handleFieldChange}
                          >
                            <MenuItem value="">&nbsp;</MenuItem>
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                        <div className={classes.descriptionWrapper}>
                          <TextField
                            id="description"
                            name="description"
                            color="secondary"
                            variant="filled"
                            multiline
                            maxRows={6}
                            minRows={6}
                            className={clsx(classes.descriptionField, {
                              [classes.previewDescription]: previewDescription,
                            })}
                            label={`Description${previewDescription ? ' Preview' : ''}`}
                            required
                            helperText={
                              formState.description.error || (
                                <div>
                                  This should be a 1-4 sentence description of your flag that
                                  explains any design choices you made. You can use
                                  {' '}
                                  <ExternalLink
                                    color="secondary"
                                    href="https://www.reddit.com/wiki/markdown"
                                  >
                                    Reddit Markdown
                                  </ExternalLink>
                                  {' '}
                                  in this field.
                                </div>
                              )
                            }
                            error={!!formState.description.error}
                            value={formState.description.value}
                            onBlur={handleFieldBlur}
                            onChange={handleFieldChange}
                          />
                          <RedditMarkdown
                            className={clsx(classes.descriptionPreview, {
                              [classes.descriptionEntry]: !previewDescription,
                            })}
                            text={formState.description.value}
                          />
                        </div>
                        <Button
                          className={classes.previewDescriptionButton}
                          color="secondary"
                          onClick={handlePreviewDescriptionClick}
                        >
                          {previewDescription ? 'Hide Preview' : 'Preview Description'}
                        </Button>
                        <FormControl
                          required
                          component="fieldset"
                          color="secondary"
                          error={getComplianceError()}
                        >
                          <FormLabel className={classes.complianceLegend} component="legend">
                            Contest Compliance
                          </FormLabel>
                          <FormGroup className={classes.complianceCheckboxes}>
                            <ComplianceCheckbox
                              checked={formState.complianceOriginalDesign.value || false}
                              label="Is your flag an original design for this contest?"
                              name="complianceOriginalDesign"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                            <ComplianceCheckbox
                              checked={formState.complianceAuthorshipAnonymous.value || false}
                              label="Have you kept your authorship anonymous?"
                              name="complianceAuthorshipAnonymous"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                            <ComplianceCheckbox
                              checked={formState.complianceEffort.value || false}
                              label="Have you put effort into your design and it is not designed to troll?"
                              name="complianceEffort"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                            <ComplianceCheckbox
                              checked={formState.complianceOriginalArt.value || false}
                              label={`Is all the art used either original, or any components taken
                                from public domain attributed in the description?`}
                              name="complianceOriginalArt"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                            <ComplianceCheckbox
                              checked={formState.complianceNsfwFree.value || false}
                              label={`Is your flag free of NSFW content? This includes nudity, gore
                                and banned symbols.`}
                              name="complianceNsfwFree"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                            <ComplianceCheckbox
                              checked={formState.complianceFlatFlag.value || false}
                              label="Is your flag flat and not textured?"
                              name="complianceFlatFlag"
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                          <FormHelperText>
                            Check each box to indicate that your flag complies with that rule. If
                            your flag does not comply with the rules, fix it and submit again.
                          </FormHelperText>
                        </FormControl>
                        <SpinnerButton
                          color="primary"
                          disabled={submissionExpired}
                          onClick={submitForm}
                          submitting={disableSubmitting}
                          variant="contained"
                        >
                          Submit
                        </SpinnerButton>
                      </Fieldset>
                    </form>
                  </ProtectedRoute>
                </TabPanel>
                <TabPanel currentTab={selectedTab} index={2}>
                  {submissions?.length ? (
                    <div className={classes.currentSubmissions}>
                      <div>
                        <span>
                          You have
                          {' '}
                          {submissions.length
                            ? `submitted ${pluralize('entry', submissions.length, true)}`
                            : 'not submitted any entries yet'}
                          .
                        </span>
                        <Button
                          className={classes.submitAnotherButton}
                          color="primary"
                          onClick={switchToSubmissionFormTab}
                          variant="contained"
                        >
                          Submit
                          {!!submissions.length && ' Another'}
                        </Button>
                      </div>
                      <div />
                      <SubmissionsTable submissions={submissions} />
                    </div>
                  ) : (
                    <div>
                      You have not submitted any entries yet. Click&nbsp;
                      <InternalLink onClick={switchToSubmissionFormTab}>here</InternalLink>
                      &nbsp;to get started.
                    </div>
                  )}
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
        )}
      </PageContainer>
    </>
  );
}

export default Submission;
