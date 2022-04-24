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
  const isInfoOpen = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    if (isThemeLoaded) {
      setSettings({
        density: 'default',
        isHideTitles: false,
        isInfoOpen,
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
