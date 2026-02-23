import { useColorScheme } from 'react-native';

export function useThemeColor(lightColor: string, darkColor: string) {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColor : lightColor;
}
