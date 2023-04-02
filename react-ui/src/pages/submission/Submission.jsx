import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
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

import { useAuthState, useFormState, useSwrData } from '../../common';
import {
  Header, HtmlWrapper, InternalLink, ProtectedRoute,
} from '../../components';

import ComplianceCheckbox from './ComplianceCheckbox';

const useStyles = makeStyles((theme) => ({
  complianceCheckboxes: {
    rowGap: theme.spacing(1),
  },
  complianceLegend: {
    color: theme.palette.text.primary,
  },
  container: {
    marginBottom: theme.spacing(3),
  },
  divider: {
    margin: '12px 0',
  },
  file: {
    columnGap: theme.spacing(1),
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
    maxHeight: 300,
    width: 'fit-content',
  },
  flagPreviewActive: {
    display: 'block',
    maxHeight: 300,
    maxWidth: 400,
    objectFit: 'scale-down',
  },
  flagPreviewEmpty: {
    height: 300,
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 8,
    rowGap: 16,
    width: 400,
  },
  header: {
    lineHeight: '64px',
  },
}));

const fileReader = new FileReader();

function Submission() {
  const [{
    categories, id: contestId, name: contestName, prompt, submissionEnd,
  }] = useSwrData('/submission');
  const [formState, updateFormState] = useFormState(['category', 'description', 'name']);
  const [file, setFile] = useState(null);
  const [{ username }] = useAuthState();
  const fileInputRef = useRef(null);

  const updateError = (field, value) => {
    updateFormState(field, 'error', value);
  };

  const validateForm = () => {
    let validForm = true;

    const fieldsToValidate = Object.keys(formState).filter((field) => formState[field].touch);
    fieldsToValidate.forEach((field) => {
      let errorValue = null;
      switch (field) {
        case 'category':
        case 'description':
        case 'name':
          errorValue = formState[field].value ? null : 'This is a required question';
          break;
        default:
          // DO NOTHING
          break;
      }
      updateError(field, errorValue);
      validForm = validForm && !!errorValue;
    });

    return validForm;
  };

  const validateFormDebounced = debounce(
    () => {
      validateForm();
    },
    100,
    { leading: true },
  );

  fileReader.onload = ({ target: { result } }) => {
    document.getElementById('flag-preview').setAttribute('src', result);
  };

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const updateFile = ({
    target: {
      files: [inputFile],
    },
  }) => {
    if (!inputFile.type.startsWith('image/')) {
      // Handle error
      return;
    }

    fileReader.readAsDataURL(inputFile);
    setFile(inputFile);
  };

  const handleFieldBlur = ({ target: { id, name } }) => {
    updateFormState(id ?? name, 'focus', false);
    validateFormDebounced();
  };

  const handleFieldChange = ({ target: { id, name, value } }) => {
    updateFormState(id ?? name, 'value', value);
    validateFormDebounced();
  };

  const handleFieldFocus = ({ target: { id, name } }) => {
    const field = id ?? name;
    updateFormState(field, 'focus', true);
    updateFormState(field, 'touch', true);
  };

  const submitForm = () => {};

  const submissionEndDate = parseISO(submissionEnd);
  const submissionAllowed = isFuture(submissionEndDate);

  const isErrorState = (field) => {
    const { error, focus } = formState[field];
    return !!error && !focus;
  };

  const classes = useStyles();

  if (!contestId) {
    return null;
  }

  return (
    <>
      <Header position="static" to="/home">
        Contest Submission
      </Header>
      <Container className={classes.container}>
        <Typography className={classes.header} component="h1" variant="h5">
          {contestName}
        </Typography>
        <div>
          {submissionAllowed ? (
            <HtmlWrapper html={markdown(prompt)} />
          ) : (
            <div>
              The submission window for this contest is over. Click&nbsp;
              <InternalLink to={`/contests/${contestId}`}>here</InternalLink>
              &nbsp;to view entries.
            </div>
          )}
        </div>
        {submissionAllowed && (
          <>
            <Divider className={classes.divider} />
            <ProtectedRoute
              message="You must log in with Reddit to submit a flag"
              showCancel={false}
            >
              <div>
                <div>
                  <input
                    ref={fileInputRef}
                    className={classes.fileInput}
                    type="file"
                    accept="image/*"
                    onChange={updateFile}
                  />
                </div>
                <form id="submission-form" className={classes.form}>
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
                    variant="filled"
                    helperText={
                      isErrorState('name') ? formState.name.error : 'A concise name for your flag'
                    }
                    label="Flag Name"
                    required
                    error={isErrorState('name')}
                    value={formState.name.value}
                    onBlur={handleFieldBlur}
                    onChange={handleFieldChange}
                    onFocus={handleFieldFocus}
                  />
                  <div className={classes.file}>
                    <TextField
                      id="fileName"
                      className={classes.fileName}
                      variant="filled"
                      disabled
                      label="Upload File"
                      required
                      InputProps={{ readOnly: true }}
                      value={file?.name ?? ''}
                    />
                    <Button color="primary" onClick={openFilePicker}>
                      Choose file
                    </Button>
                  </div>
                  <div>
                    <Typography variant="caption">Preview</Typography>
                    <Paper
                      className={clsx(classes.flagPreview, { [classes.flagPreviewEmpty]: !file })}
                      elevation={0}
                      variant="outlined"
                    >
                      <img
                        id="flag-preview"
                        alt=""
                        className={clsx({ [classes.flagPreviewActive]: !!file })}
                      />
                    </Paper>
                  </div>
                  {!!categories.length && (
                    <TextField
                      id="category"
                      name="category"
                      select
                      variant="filled"
                      label="Category"
                      required
                      helperText={isErrorState('category') ? formState.category.error : null}
                      error={isErrorState('category')}
                      value={formState.category.value}
                      onBlur={handleFieldBlur}
                      onChange={handleFieldChange}
                      onFocus={handleFieldFocus}
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
                    variant="filled"
                    multiline
                    maxRows={6}
                    minRows={6}
                    label="Description"
                    required
                    helperText={
                      isErrorState('description')
                        ? formState.description.error
                        : `This should be a 1-4 sentence description of your flag that explains any
                           design choices you made`
                    }
                    error={isErrorState('description')}
                    value={formState.description.value}
                    onBlur={handleFieldBlur}
                    onChange={handleFieldChange}
                    onFocus={handleFieldFocus}
                  />
                  <FormControl required component="fieldset">
                    <FormLabel className={classes.complianceLegend} component="legend">
                      Contest Compliance
                    </FormLabel>
                    <FormGroup className={classes.complianceCheckboxes}>
                      <ComplianceCheckbox
                        name="original-design"
                        label="Is your flag an original design for this contest?"
                      />
                      <ComplianceCheckbox
                        name="authorship-anonymous"
                        label="Have you kept your authorship anonymous?"
                      />
                      <ComplianceCheckbox
                        name="effort"
                        label="Have you put effort into your design and it is not designed to troll?"
                      />
                      <ComplianceCheckbox
                        name="original-art"
                        label="Is all the art used either original, or any components taken from public domain attributed in the description?"
                      />
                      <ComplianceCheckbox
                        name="nsfw-free"
                        label="Is your flag free of NSFW content? This includes nudity, gore and banned symbols."
                      />
                      <ComplianceCheckbox
                        name="flag-dimensions"
                        label="Is your flag at most 3000 pixels wide, and flat and not textured?"
                      />
                    </FormGroup>
                    <FormHelperText>
                      These 6 questions should all be answered with yes. If an answer is no, fix
                      your submission until it complies with contest rules.
                    </FormHelperText>
                  </FormControl>
                  <Button variant="contained" color="primary" onClick={submitForm}>
                    Submit
                  </Button>
                </form>
              </div>
            </ProtectedRoute>
          </>
        )}
      </Container>
    </>
  );
}

export default Submission;
