const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
const { validateCreateUser } = require("../middlewares/validasi");
const { validationResult } = require("express-validator");

// Endpoint untuk mendaftar pengguna baru
router.post("/register", validateCreateUser, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 1,
      status: false,
      message: errors
        .array()
        .map((err) => err.msg)
        .join(", "),
    });
  }

  try {
    const data = req.body;
    const user = await authService.createUser(data);
    res.status(201).json({
      // Menggunakan 201 Created
      code: 0,
      status: true,
      message: "User  created successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      // Menggunakan 400 Bad Request untuk kesalahan yang dihasilkan dari input
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    console;
    if (user === "User  is locked or status is not unlock") {
      return res.status(401).json({
        // Menggunakan 401 Unauthorized
        code: 1,
        status: false,
        message: "User  not found or incorrect credentials",
      });
    } else if (user === "Incorrect password") {
      return res.status(401).json({
        // Menggunakan 401 Unauthorized
        code: 1,
        status: false,
        message: user.message,
      });
    }
    res.status(200).json({
      // Menggunakan 200 OK
      code: 0,
      status: true,
      message: "User  logged in successfully",
      token: user.token,
    });
  } catch (error) {
    res.status(400).json({
      // Menggunakan 400 Bad Request untuk kesalahan yang dihasilkan dari input
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

// Endpoint untuk verifikasi OTP
router.get("/verifOtp/:otp", async (req, res) => {
  try {
    const otp = req.params;
    const user = await authService.VerifOtp(otp.otp);

    if (!user) {
      return res.status(404).json({
        // Menggunakan 404 Not Found jika pengguna tidak ditemukan
        code: 3,
        status: false,
        message: "User  not found or OTP is invalid",
      });
    }

    res.status(200).json({
      // Menggunakan 200 OK untuk respons yang berhasil
      code: 0,
      status: true,
      message: "OTP verified successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      // Menggunakan 400 Bad Request untuk kesalahan yang dihasilkan dari input
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
