const { body } = require("express-validator");

// Middleware untuk validasi input saat membuat pengguna
const validateCreateUser = [
  body("username").isString().withMessage("Username must be a string"),
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("dateOfBirth")
    .isString()
    .withMessage("Date of Birth must be a valid date in YYYY-MM-DD format"),
  body("phoneNumber").isString().withMessage("Phone number must be a string"),
];

module.exports = { validateCreateUser };
