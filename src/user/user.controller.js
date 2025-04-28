const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const userService = require("./user.service");
const router = express.Router();
router.get("/", authMiddleware(["user"]), async (req, res) => {
  try {
    const user = await userService.getUserall(req.user.username);
    res.status(200).json({
      user,
    });
  } catch {}
});

module.exports = router;
