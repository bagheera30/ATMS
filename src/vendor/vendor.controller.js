const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();
const vendorService = require("./vendor.service");

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const vendor = await vendorService.getall();
    res.status(200).json({
      code: 0,
      status: true,
      vendor,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.post("/", authMiddleware(["manager"]), async (req, res) => {
  const data = req.body;
  const username = req.user.username;
  const uuid = "";
  try {
    const vendor = await vendorService.updsertVendor(uuid, data, username);
    res.status(200).json({
      code: 0,
      status: true,
      vendor,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
