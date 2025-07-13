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
              target: "./src/*/*.controller.js",
              from: "./src/*/*.repository.js",
              message:
                "[ARCHITECTURE] Controller harus mengakses Service, bukan Repository langsung!",
            },
            {
              target: "./src/user/*.service.js",
              from: "./src/*/*.controller.js",
              message:
                "[ARCHITECTURE] Service tidak boleh mengimpor Controller!",
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
