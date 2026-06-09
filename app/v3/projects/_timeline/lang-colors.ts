/**
 * V3-friendly language palette — bright enough to be legible on the cream
 * canvas, distinct enough to read at-a-glance in the stacked bar.
 */
export const LANG_COLOR: Record<string, string> = {
  Python: "#13B8F3",      // bio blue
  TypeScript: "#0A96C7",  // deep blue
  JavaScript: "#EDB427",  // gold
  Shell: "#169E73",       // green
  Bash: "#169E73",
  C: "#252521",           // charcoal
  "C++": "#33332E",
  Go: "#0A96C7",
  Rust: "#EE766C",        // coral
  HTML: "#C5443A",        // coral dark
  CSS: "#A855F7",         // violet
  Vue: "#42b883",
  SCSS: "#C97AC9",
  MDX: "#B07F08",         // gold dark
  Markdown: "#6B6B62",    // slate
  Java: "#EDB427",
  Kotlin: "#A855F7",
  Swift: "#EE766C",
  Ruby: "#C5443A",
  PHP: "#7F5AB6",
  Lua: "#0A96C7",
  Dart: "#13B8F3",
  R: "#13B8F3",
  Haskell: "#A855F7",
  Elixir: "#A855F7",
  Scala: "#C5443A",
  Zig: "#EDB427",
  Nim: "#EDB427",
  Dockerfile: "#0A96C7",
  YAML: "#6B6B62",
  TOML: "#A9A99E",
  JSON: "#6B6B62",
  Makefile: "#6B6B62",
}

export function langColor(name: string): string {
  return LANG_COLOR[name] ?? "#6B6B62"
}
