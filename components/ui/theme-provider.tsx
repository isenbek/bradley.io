'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig, getTheme, generateCSSVariables } from '@/lib/theme-config';

interface ThemeContextType {
  currentTheme: string;
  themeConfig: ThemeConfig;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({ children, defaultTheme = 'default' }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [themeConfig, setThemeConfig] = useState(getTheme(defaultTheme));

  const availableThemes = ['default', 'terminal', 'minimal'];

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('bradley-io-theme');
    if (savedTheme && availableThemes.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      setThemeConfig(getTheme(savedTheme));
    }
  }, []);

  useEffect(() => {
    // Apply theme CSS variables
    const root = document.documentElement;
    const cssVariables = generateCSSVariables(themeConfig);
    
    // Clear existing theme variables
    root.style.removeProperty('--background');
    root.style.removeProperty('--foreground');
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-foreground');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--secondary-foreground');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-foreground');
    root.style.removeProperty('--muted');
    root.style.removeProperty('--muted-foreground');
    root.style.removeProperty('--border');
    root.style.removeProperty('--card');
    root.style.removeProperty('--card-foreground');
    
    // Set new theme variables
    cssVariables.split('\n').forEach(line => {
      const [property, value] = line.split(':').map(s => s.trim());
      if (property && value && property.startsWith('--')) {
        root.style.setProperty(property, value.replace(';', ''));
      }
    });

    // Apply typography and spacing
    root.style.setProperty('--font-family', themeConfig.typography.fontFamily);
    root.style.setProperty('--heading-font', themeConfig.typography.headingFont);
    root.style.setProperty('--font-size', themeConfig.typography.fontSize);
    root.style.setProperty('--line-height', themeConfig.typography.lineHeight);
    root.style.setProperty('--container-max-width', themeConfig.spacing.container);
    root.style.setProperty('--section-spacing', themeConfig.spacing.section);
    root.style.setProperty('--border-radius', themeConfig.effects.borderRadius);
    root.style.setProperty('--shadow', themeConfig.effects.shadow);
  }, [themeConfig]);

  const setTheme = (themeName: string) => {
    if (availableThemes.includes(themeName)) {
      setCurrentTheme(themeName);
      setThemeConfig(getTheme(themeName));
      localStorage.setItem('bradley-io-theme', themeName);
    }
  };

  const value = {
    currentTheme,
    themeConfig,
    setTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}