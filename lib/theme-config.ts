export interface ThemeConfig {
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
    lineHeight: string;
  };
  spacing: {
    container: string;
    section: string;
  };
  effects: {
    borderRadius: string;
    shadow: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  default: {
    name: "Bradley.io Professional",
    description: "Clean, professional theme with teal and coral accents",
    colors: {
      background: "#ffffff",
      foreground: "#0a0a0a",
      primary: "#0f4c75",
      primaryForeground: "#ffffff",
      secondary: "#7acfd6",
      secondaryForeground: "#ffffff",
      accent: "#e0474c",
      accentForeground: "#ffffff",
      muted: "#f5f5f5",
      mutedForeground: "#737373",
      border: "#e5e5e5",
      card: "#ffffff",
      cardForeground: "#0a0a0a",
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      headingFont: "'Inter', system-ui, sans-serif",
      fontSize: "16px",
      lineHeight: "1.6",
    },
    spacing: {
      container: "1200px",
      section: "80px",
    },
    effects: {
      borderRadius: "8px",
      shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    },
  },
  terminal: {
    name: "Terminal Dark",
    description: "Dark monospace theme inspired by terminal interfaces",
    colors: {
      background: "#1a365d",
      foreground: "#e2e8f0",
      primary: "#ffd700",
      primaryForeground: "#1a365d",
      secondary: "#ff8c00",
      secondaryForeground: "#1a365d",
      accent: "#ff8c00",
      accentForeground: "#1a365d",
      muted: "rgba(0, 0, 0, 0.3)",
      mutedForeground: "#a0aec0",
      border: "rgba(226, 232, 240, 0.1)",
      card: "rgba(0, 0, 0, 0.2)",
      cardForeground: "#e2e8f0",
    },
    typography: {
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      headingFont: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      fontSize: "14px",
      lineHeight: "1.6",
    },
    spacing: {
      container: "900px",
      section: "60px",
    },
    effects: {
      borderRadius: "4px",
      shadow: "none",
    },
  },
  minimal: {
    name: "Minimal Light",
    description: "Clean, minimal theme with subtle accents",
    colors: {
      background: "#ffffff",
      foreground: "#1a1a1a",
      primary: "#000000",
      primaryForeground: "#ffffff",
      secondary: "#666666",
      secondaryForeground: "#ffffff",
      accent: "#0066cc",
      accentForeground: "#ffffff",
      muted: "#f8f8f8",
      mutedForeground: "#666666",
      border: "#e0e0e0",
      card: "#ffffff",
      cardForeground: "#1a1a1a",
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      headingFont: "'Inter', system-ui, sans-serif",
      fontSize: "16px",
      lineHeight: "1.7",
    },
    spacing: {
      container: "800px",
      section: "100px",
    },
    effects: {
      borderRadius: "0px",
      shadow: "none",
    },
  },
};

export function getTheme(themeName: string): ThemeConfig {
  return themes[themeName] || themes.default;
}

export function generateCSSVariables(theme: ThemeConfig): string {
  return `
    --background: ${theme.colors.background};
    --foreground: ${theme.colors.foreground};
    --primary: ${theme.colors.primary};
    --primary-foreground: ${theme.colors.primaryForeground};
    --secondary: ${theme.colors.secondary};
    --secondary-foreground: ${theme.colors.secondaryForeground};
    --accent: ${theme.colors.accent};
    --accent-foreground: ${theme.colors.accentForeground};
    --muted: ${theme.colors.muted};
    --muted-foreground: ${theme.colors.mutedForeground};
    --border: ${theme.colors.border};
    --card: ${theme.colors.card};
    --card-foreground: ${theme.colors.cardForeground};
    --font-family: ${theme.typography.fontFamily};
    --heading-font: ${theme.typography.headingFont};
    --font-size: ${theme.typography.fontSize};
    --line-height: ${theme.typography.lineHeight};
    --container-max-width: ${theme.spacing.container};
    --section-spacing: ${theme.spacing.section};
    --border-radius: ${theme.effects.borderRadius};
    --shadow: ${theme.effects.shadow};
  `.trim();
}