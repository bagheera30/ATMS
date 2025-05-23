const express = require("express");
const { gettasklist, getalltask } = require("./task.service");
const authMiddleware = require("../middlewares/autentication");

const router = express.Router();

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await getalltask();
    res.status(200).json({
      code: 0,
      status: true,
      message: "success",
      data,
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
