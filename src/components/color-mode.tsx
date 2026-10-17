// Light / dark mode: follows the phone's setting (next-themes, class on <html>).
import { ThemeProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ColorModeProvider(props: ThemeProviderProps) {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />;
}

export type ColorMode = 'light' | 'dark';

export function useColorMode() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  return {
    colorMode: (forcedTheme || resolvedTheme) as ColorMode,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? dark : light;
}
