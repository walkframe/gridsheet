import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

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
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
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
    },
  },
];