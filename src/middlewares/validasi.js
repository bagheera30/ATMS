const { body } = require("express-validator");

// Middleware untuk validasi input saat membuat pengguna
const validateCreateUser = [
  body("namaLengkap").isString().withMessage("Nama lengkap must be a string"),
  body("email")
    .isEmail()
    .withMessage("Email is not valid")
    .matches(/@gmail\.com$/)
    .withMessage("Email must be a Gmail address"),
  body("jabatan").isString().withMessage("Jabatan must be a string"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("dateOfBirth")
    .isString()
    .withMessage("Date of Birth must be a valid date in YYYY-MM-DD format"),
];

module.exports = { validateCreateUser };
