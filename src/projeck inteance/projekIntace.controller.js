const express = require("express");
const projekIntanceService = require("./projekintace.service");
const uploadToMinio = require("../lib/minioUpload");
const upload = require("../lib/multerConfig");
const { auth } = require("neo4j-driver");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();

router.post(
  "/",
  authMiddleware(["manager"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const data = req.body;
      const file = req.file;
      const username = req.user.username;
      const user = await projekIntanceService.createProjek(
        data,
        file,
        username
      );

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
  }
);

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const user = await projekIntanceService.getAll();
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
