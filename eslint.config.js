import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      '**/dist/**/*', 
      '**/*.js',
      '**/storybook/**/*',
      'e2e/**/*',
      '**/*.config.ts',
      '**/*.spec.ts',
      '**/*.mjs',
    ],
  },
  {
    languageOptions: {
      parser: tseslintParser,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    rules: {
      semi: "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": "off",
      curly: ['error', 'all'],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];