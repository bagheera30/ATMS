import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs", // Penting untuk mendukung 'require' dan 'module'
      globals: {
        node: true,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/*/*.service.js",
              from: "./src/*/*.repository.js",
              message:
                "[ARCHITECTURE] Service harus mengakses Repository melalui interface/abstraksi!",
            },
            {
              target: "./src/*/*.controller.js",
              from: "./src/*/*.service.js",
              message:
                "[ARCHITECTURE] Controller harus mengakses Service melalui interface/abstraksi!",
            },
          ],
        },
      ],
      "no-unused-vars": "warn",
      "no-useless-catch": "warn",
      "no-undef": "off", // Nonaktifkan karena sudah ditangani oleh konfigurasi recommended
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
];
