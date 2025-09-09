'use client';

import { useTheme } from './theme-provider';
import { themes } from '@/lib/theme-config';

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-select" className="text-sm font-medium text-muted-foreground">
        Theme:
      </label>
      <select
        id="theme-select"
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        className="px-2 py-1 text-sm bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {availableThemes.map((themeName) => (
          <option key={themeName} value={themeName}>
            {themes[themeName]?.name || themeName}
          </option>
        ))}
      </select>
    </div>
  );
}