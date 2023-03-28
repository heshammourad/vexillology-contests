import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import isFuture from 'date-fns/isFuture';
import parseISO from 'date-fns/parseISO';
import { useRef, useState } from 'react';
import { markdown } from 'snudown-js';

import { useAuthState, useSwrData } from '../../common';
import {
  Header, HtmlWrapper, InternalLink, ProtectedRoute,
} from '../../components';

const useStyles = makeStyles({
  divider: {
    margin: '12px 0',
  },
  fileInput: {
    clip: 'rect(1px, 1px, 1px, 1px)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    width: 1,
  },
  flagPreview: {
    width: 300,
  },
  header: {
    lineHeight: '64px',
  },
  inactive: {
    display: 'none',
  },
  username: {
    fontWeight: 'bold',
  },
});

const fileReader = new FileReader();

function Submission() {
  const [{
    id, name, prompt, submissionEnd,
  }] = useSwrData('/submission');
  const [file, setFile] = useState(null);
  const [{ username }] = useAuthState();
  const fileInputRef = useRef(null);

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

  const submissionEndDate = parseISO(submissionEnd);
  const submissionAllowed = isFuture(submissionEndDate);

  const classes = useStyles();
  return (
    <>
      <Header position="static" to="/home">
        Contest Submission
      </Header>
      <Container>
        <Typography className={classes.header} component="h1" variant="h5">
          {name}
        </Typography>
        <div>
          {submissionAllowed ? (
            <HtmlWrapper html={markdown(prompt)} />
          ) : (
            <div>
              The submission window for this contest is over. Click&nbsp;
              <InternalLink to={`/contests/${id}`}>here</InternalLink>
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
                Submitting as&nbsp;
                <span className={classes.username}>{username}</span>
              </div>
              <form>
                <TextField
                  id="name"
                  helperText="A concise name for your flag"
                  label="Flag Name"
                  required
                />
                <div>
                  <input
                    ref={fileInputRef}
                    className={classes.fileInput}
                    type="file"
                    accept="image/*"
                    onChange={updateFile}
                  />
                </div>
                <img
                  id="flag-preview"
                  alt=""
                  className={clsx(classes.flagPreview, { [classes.inactive]: !file })}
                />
                <Button color="primary" onClick={openFilePicker}>
                  Choose file
                </Button>
              </form>
            </ProtectedRoute>
          </>
        )}
      </Container>
    </>
  );
}

export default Submission;
