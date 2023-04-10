import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import isFuture from 'date-fns/isFuture';
import parseISO from 'date-fns/parseISO';
import debounce from 'lodash/debounce';
import { useRef, useState } from 'react';
import { markdown } from 'snudown-js';

import { postData } from '../../api';
import {
  uploadFile, useAuthState, useFormState, useSnackbarState, useSwrData,
} from '../../common';
import snackbarTypes from '../../common/snackbarTypes';
import {
  Header, HtmlWrapper, InternalLink, PageContainer, ProtectedRoute,
} from '../../components';

import ComplianceCheckbox from './ComplianceCheckbox';

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
    height: 300,
    width: '100%',
  },
  form: {
    border: 0,
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    minWidth: 0,
    padding: 0,
    rowGap: 16,
  },
  header: {
    lineHeight: '64px',
  },
  subheader: {
    marginBottom: theme.spacing(1),
  },
  submitAnotherEntryButton: {
    marginTop: theme.spacing(2),
  },
}));

const fileReader = new FileReader();

function Submission() {
  const [
    {
      data: {
        categories, firebaseToken, id: contestId, name: contestName, prompt, submissionEnd,
      },
    },
  ] = useSwrData('/submission');
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
  const [{ accessToken, refreshToken, username }] = useAuthState();
  const updateSnackbarState = useSnackbarState();
  const [showForm, setShowForm] = useState(true);
  const [fileDimensions, setFileDimensions] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const fileNameRef = useRef(null);
  const flagPreviewRef = useRef(null);

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

  const getComplianceError = () => {
    const complianceFields = Object.keys(formState).filter((field) => field.startsWith('compliance'));
    return complianceFields.some((field) => {
      const { touch, value } = formState[field];
      return touch && !value;
    });
  };

  const submitForm = async () => {
    let errorSubmitting = false;
    try {
      setSubmitting(true);

      Object.keys(formState).forEach((field) => {
        updateFormState(field, 'touch', true);
      });

      const validForm = validateForm(true) && !getComplianceError();

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

      const response = postData(
        '/submission',
        {
          category: formState.category.value,
          contestId,
          description: formState.description.value,
          height: fileDimensions.height,
          name: formState.name.value,
          url: downloadUrl,
          width: fileDimensions.width,
        },
        { accessToken, refreshToken },
      );
      if (!response) {
        errorSubmitting = true;
        return;
      }

      resetFormState();
      setShowForm(false);
    } catch {
      errorSubmitting = true;
    } finally {
      if (errorSubmitting) {
        updateSnackbarState(snackbarTypes.SUBMISSION_ERROR);
      }
      setSubmitting(false);
    }
  };

  const submissionEndDate = parseISO(submissionEnd);
  const submissionAllowed = isFuture(submissionEndDate);

  const classes = useStyles();

  return (
    <>
      <Header position="static" to="/home">
        Contest Submission
      </Header>
      {contestId && (
        <PageContainer>
          <Typography className={classes.header} component="h1" variant="h6">
            {contestName}
          </Typography>
          {submissionAllowed ? (
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography className={classes.subheader} component="h2" variant="subtitle1">
                  Contest prompt
                </Typography>
                <HtmlWrapper html={markdown(prompt)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper>
                  <Box padding={2}>
                    <ProtectedRoute
                      message="You must log in with Reddit to submit a flag"
                      showCancel={false}
                    >
                      {showForm ? (
                        <form id="submission-form">
                          <Typography
                            className={classes.subheader}
                            component="h2"
                            variant="subtitle1"
                          >
                            Submission form
                          </Typography>
                          <fieldset className={classes.form} disabled={submitting}>
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
                            <TextField
                              id="description"
                              name="description"
                              color="secondary"
                              variant="filled"
                              multiline
                              maxRows={6}
                              minRows={6}
                              label="Description"
                              required
                              helperText={
                                formState.description.error
                                || `This should be a 1-4 sentence description of your flag that explains
                              any design choices you made`
                              }
                              error={!!formState.description.error}
                              value={formState.description.value}
                              onBlur={handleFieldBlur}
                              onChange={handleFieldChange}
                            />
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
                                Check each box to indicate that your flag complies with that rule.
                                If your flag does not comply with the rules, fix it and submit
                                again.
                              </FormHelperText>
                            </FormControl>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={submitting}
                              onClick={submitForm}
                            >
                              {submitting ? <CircularProgress size={24} /> : 'Submit'}
                            </Button>
                          </fieldset>
                        </form>
                      ) : (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Typography component="div" variant="subtitle2">
                            Your entry has been submitted.
                          </Typography>
                          <Button
                            color="primary"
                            variant="contained"
                            className={classes.submitAnotherEntryButton}
                            onClick={() => {
                              setShowForm(true);
                            }}
                          >
                            Submit Another Entry
                          </Button>
                        </Box>
                      )}
                    </ProtectedRoute>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <div>
              The submission window for this contest is over. Click&nbsp;
              <InternalLink to={`/contests/${contestId}`}>here</InternalLink>
              &nbsp;to view entries.
            </div>
          )}
        </PageContainer>
      )}
    </>
  );
}

export default Submission;
