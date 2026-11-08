import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { AppPalette, DarkPalette, LightPalette } from './Color';

const LocalAppPalette = createContext<AppPalette>(LightPalette);

export function useAppTheme(): { colors: AppPalette; isDark: boolean } {
  const colors = useContext(LocalAppPalette);
  const scheme = useColorScheme();
  return {
    colors,
    isDark: scheme === 'dark',
  };
}

export const AppTheme = {
  useColors(): AppPalette {
    return useContext(LocalAppPalette);
  },
};

export const SilowniaTheme: React.FC<{
  darkTheme?: boolean;
  children: React.ReactNode;
}> = ({ darkTheme, children }) => {
  const systemScheme = useColorScheme();
  const isDark = darkTheme ?? systemScheme === 'dark';
  const palette = isDark ? DarkPalette : LightPalette;

  return (
    <LocalAppPalette.Provider value={palette}>
      {children}
    </LocalAppPalette.Provider>
  );
};
