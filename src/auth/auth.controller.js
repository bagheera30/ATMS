const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, dateOfBirth, phoneNumber } = req.body;
    const user = await authService.registerUser(
      username,
      email,
      password,
      dateOfBirth,
      phoneNumber
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
