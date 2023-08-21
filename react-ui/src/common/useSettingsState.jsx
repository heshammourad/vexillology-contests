/**
 * ??? use-persisted-state is an abandoned package, find alternative
 * ??? setSettings does not allow access to prev value
 * Manages display settings
 * @param density Controls size of images
 * @param isEntryDescriptionOpen When viewing entry, show description
 */

import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useEffect } from 'react';
import createPersistedState from 'use-persisted-state';

const usePersistedSettings = createPersistedState('settings');

const useSettingsState = () => {
  const [settings, setSettings] = usePersistedSettings({});
  const theme = useTheme();

  /* useMediaQuery always starts false, so we know it's loaded when xs is true */
  const isThemeLoaded = useMediaQuery(theme.breakpoints.up('xs'));
  const isEntryDescriptionOpen = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    if (isThemeLoaded) {
      setSettings({
        density: 'default',
        isEntryDescriptionOpen,
        ...settings,
      });
    }
  }, [isThemeLoaded]);

  const updateSettings = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return [settings, updateSettings];
};

export default useSettingsState;
