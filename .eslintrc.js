module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true, // This enables Node.js global variables
    commonjs: true, // This enables CommonJS globals (like require and module)
    es2021: true,
  },
  plugins: ["import"],
  rules: {
    // Your custom rules here
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "./src/*/*.controller.js",
            from: "./src/*/*.repository.js",
            message:
              "[ARCHITECTURE] Controller harus mengakses Service, bukan Repository langsung!",
          },
          {
            target: "./src/user/*.service.js",
            from: "./src/*/*.controller.js",
            message: "[ARCHITECTURE] Service tidak boleh mengimpor Controller!",
          },
        ],
      },
    ],
    "no-unused-vars": "warn",
    "no-useless-catch": "warn",
  },
  overrides: [
    {
      files: ["**/*.js"],
      parserOptions: {
        sourceType: "script",
        ecmaVersion: 2021,
      },
    },
  ],
};
