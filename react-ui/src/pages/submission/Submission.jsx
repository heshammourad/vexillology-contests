import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { markdown } from 'snudown-js';

import { useAuthState } from '../../common';
import { Header, HtmlWrapper, ProtectedRoute } from '../../components';

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

  const string = `Here's an example of some reddit formatting tricks:
**Bold**, *italic*, \`code\`, [link](http://redditpreview.com), ~~strikethrough~~
  `;

  const classes = useStyles();
  return (
    <>
      <Header position="static" to="/home">
        Contest Submission
      </Header>
      <Container>
        <Typography className={classes.header} component="h1" variant="h5">
          Design a flag for a Dungeons and Dragons character class
        </Typography>
        <div>
          <HtmlWrapper html={markdown(string)} />
          <p>
            This month, we are taking inspiration from the classic world of tabletop role playing
            games
          </p>

          <p>
            We want you to design a flag to represent one of the fourteen character classes from
            Dungeons and Dragons.
          </p>

          <p>These classes are as follows:</p>

          <table>
            <tbody>
              <tr>
                <td>
                  <a href="https://www.dndbeyond.com/classes/artificer">
                    <strong>Artificer</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/barbarian">
                    <strong>Barbarian</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/bard">
                    <strong>Bard</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/blood-hunter">
                    <strong>Blood Hunter</strong>
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="https://www.dndbeyond.com/classes/cleric">
                    <strong>Cleric</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/druid">
                    <strong>Druid</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/fighter">
                    <strong>Fighter</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/monk">
                    <strong>Monk</strong>
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="https://www.dndbeyond.com/classes/paladin">
                    <strong>Paladin</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/ranger">
                    <strong>Ranger</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/rogue">
                    <strong>Rogue</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/sorcerer">
                    <strong>Sorcerer</strong>
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="https://www.dndbeyond.com/classes/warlock">
                    <strong>Warlock</strong>
                  </a>
                </td>
                <td>
                  <a href="https://www.dndbeyond.com/classes/wizard">
                    <strong>Wizard</strong>
                  </a>
                </td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>

          <p>Important contest notes:</p>

          <p>Please design your flags for one of these classes generally. </p>

          <p>NOT a specific character.</p>

          <p>NOT a specific lineage. (Not elven bards or dwarf rangers etc)</p>

          <p>NOT one of the more specific sub classes. (No Warchefs or Synthisits)</p>

          <p>
            NOT one of the other classes not in this list (we are not fractally spilling out into
            the various homebrew options)
          </p>

          <p>
            If it helps, imagine it as a special patch or identifying banner representing all the
            people in these classes.
          </p>
        </div>
        <Divider className={classes.divider} />
        <ProtectedRoute message="You must log in with Reddit to submit a flag" showCancel={false}>
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
      </Container>
    </>
  );
}

export default Submission;
