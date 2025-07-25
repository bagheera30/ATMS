const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
const { validateCreateUser } = require("../middlewares/validasi");
const { validationResult } = require("express-validator");

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
    if (!user.status) {
      return res.status(404).json({
        code: 2,
        status: false,
        message: user.message,
      });
    }
    res.status(201).json({
      user,
    });
  } catch (error) {
    res.status(400).json({
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

    if (user === "User is locked or status is not unlocked") {
      return res.status(401).json({
        code: 1,
        status: false,
        message: "User  not unlock please contact manager or admin",
      });
    } else if (user.message === "Incorrect password") {
      return res.status(401).json({
        code: 1,
        status: false,
        message: user.message,
      });
    } else if (user === "User  not found or incorrect credentials") {
      return res.status(401).json({
        code: 1,
        status: false,
        message: user,
      });
    }
    res.status(200).json({
      code: 0,
      status: true,
      message: user.message,
      token: user.token,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.get("/verifOtp/:otp", async (req, res) => {
  try {
    const otp = req.params;
    const user = await authService.VerifOtp(otp.otp);
    if (user.status == false) {
      return res.status(404).json({
        code: 2,
        status: false,
        message: user.message,
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.post("/forgotPassword", async (req, res) => {
  try {
    const data = req.body;

    if (!data.email) {
      return res.status(400).json({
        code: 1,
        status: false,
        message: "email diperlukan",
      });
    }

    const result = await authService.forgotPassword(data);
    if (result.status == false) {
      return res.status(404).json({
        code: result.code,
        status: result.status,
        message: result.message,
      });
    }

    res.status(200).json({
      code: 0,
      status: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in forgotPassword route:", error);
    res.status(500).json({
      code: 2,
      status: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
});

router.post("/resendotp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await authService.resendOtp(email);
    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
