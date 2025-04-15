const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
router.post("/register", async (req, res) => {
  try {
    const data = req.body;
    const user = await authService.createUser(data);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
