import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { Header } from '../../components';

const useStyles = makeStyles({
  header: {
    lineHeight: '64px',
  },
});

function Submission() {
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
          NOT one of the other classes not in this list (we are not fractally spilling out into the
          various homebrew options)
        </p>

        <p>
          If it helps, imagine it as a special patch or identifying banner representing all the
          people in these classes.
        </p>
        <Divider />
      </Container>
    </>
  );
}

export default Submission;
