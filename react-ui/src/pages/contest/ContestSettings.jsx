/**
 * Contest display settings
 */

import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListSubheader from '@material-ui/core/ListSubheader';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles } from '@material-ui/core/styles';

import useSettingsState from '../../common/useSettingsState';
import { CustomRadio } from '../../components';

const useStyles = makeStyles((theme) => ({
  listSubheader: {
    color: theme.palette.grey[900],
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.8px',
    lineHeight: 1,
    margin: '16px 0',
    textTransform: 'uppercase',
  },
}));

function ContestSettings() {
  const [{ density = 'default' }, updateSettings] = useSettingsState();

  const handleDensityChange = (event) => {
    updateSettings('density', event.target.value);
  };

  const classes = useStyles();

  return (
    <FormControl component="fieldset">
      <List
        dense
        subheader={(
          <ListSubheader className={classes.listSubheader}>
            Density
          </ListSubheader>
        )}
      >
        <RadioGroup
          aria-label="density"
          name="density"
          value={density}
          onChange={handleDensityChange}
        >
          <ListItem>
            <FormControlLabel
              value="default"
              control={<CustomRadio color="primary" />}
              label="Default"
            />
          </ListItem>
          <ListItem>
            <FormControlLabel
              value="compact"
              control={<CustomRadio color="primary" />}
              label="Compact"
            />
          </ListItem>
        </RadioGroup>
      </List>
    </FormControl>
  );
}

export default ContestSettings;
