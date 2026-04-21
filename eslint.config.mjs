import js from "@eslint/js"
import svelte from "eslint-plugin-svelte"
import jsdoc from "eslint-plugin-jsdoc"
import svelteParser from "svelte-eslint-parser"
import globals from "globals"

export default [
  js.configs.recommended,
  jsdoc.configs["flat/recommended"],
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "max-lines": ["warn", { max: 400, skipBlankLines: false, skipComments: false }],
      "no-unused-vars": ["warn", { args: "none" }],
      "no-case-declarations": "warn",
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
            MethodDefinition: false,
          },
          publicOnly: false,
          enableFixer: false,
          checkConstructors: false,
        },
      ],
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
    },
    rules: {
      "jsdoc/require-jsdoc": "off",
    },
  },
  {
    files: ["eslint.config.*", "vite.config.*", "vitest.config.*"],
    languageOptions: {
      globals: globals.node,
    },
  },
]
