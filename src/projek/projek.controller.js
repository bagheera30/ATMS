const express = require("express");
const projekIntanceService = require("./projek.service");
const uploadToMinio = require("../lib/minioUpload");
const upload = require("../lib/multerConfig");
const { auth } = require("neo4j-driver");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();

router.post(
  "/add",
  authMiddleware(["manager"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const data = req.body;
      const file = req.file;
      const username = req.user.username;
      await projekIntanceService.createProjek(data, file, username);

      res.status(201).json({
        code: 0,
        status: true,
        message: "success",
      });
    } catch (error) {
      res.status(400).json({
        code: 2,
        status: false,
        message: error.message,
      });
    }
  }
);

router.post("/start", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = req.body;
    const username = req.user.username;
    await projekIntanceService.startIntance(data, username);
    res.status(201).json({
      code: 0,
      status: true,
      message: "success",
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await projekIntanceService.getdefinition();
    res.status(200).json({
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
