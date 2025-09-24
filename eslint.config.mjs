// eslint.config.mjs
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unused from "eslint-plugin-unused-imports";
import prettier from "eslint-plugin-prettier";

export default [
  // ігноруємо білди, залежності й артефакти
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "coverage/**", "next-env.d.ts"],
  },

  // TypeScript / React файли
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: false, // без проектного аналізу швидше; для CI достатньо `tsc --noEmit`
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "unused-imports": unused,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs["recommended"].rules,

      // якість
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // порядок імпортів
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-undef": "off",

      // Prettier
      "prettier/prettier": "error",
    },
    settings: {
      "import/resolver": {
        typescript: { project: "." },
      },
    },
  },

  // Звичайні JS файли (конфіги, скрипти)
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: { ...js.configs.recommended.rules },
  },
];
