import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: [
      "archive/**",
      ".next/**",
      // deploy.sh builds into .next-staging and keeps the last build at
      // .next-previous for rollback, so both exist on disk when `eslint .` runs
      // at step 2. Neither was ignored, and linting compiled output produced
      // 35,181 errors in webpack chunks: `eslint .` walking a build directory
      // fails the deploy before it reaches the build, and the error list gives
      // no hint that the cause is a generated file. .next-* covers any future
      // variant rather than naming these two and waiting for a third.
      ".next-*/**",
      "node_modules/**",
      "scripts/**",
      "public/**",
      "next-env.d.ts",
      "wargames-server.js",
      "ecosystem.config.js",
      "telemetry/**",
      "app/_legacy/**",
    ],
  }
);
