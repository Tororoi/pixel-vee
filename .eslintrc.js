module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:jsdoc/recommended",
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      files: ["**/*.jsx"],
      rules: {
        "react/prop-types": "off",
        "jsdoc/require-jsdoc": "off",
        "jsdoc/require-param": "off",
        "jsdoc/require-param-description": "off",
        "jsdoc/require-param-type": "off",
        "jsdoc/require-returns": "off",
        "jsdoc/require-returns-description": "off",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "jsdoc"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "no-unused-vars": ["warn", { args: "none" }],
    "no-case-declarations": "warn",
    "jsdoc/require-jsdoc": ["warn", {
      require: {
        FunctionDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false,
        MethodDefinition: false,
      },
      publicOnly: false,
      enableFixer: false,
      checkConstructors: false,
    }],
  },
}
