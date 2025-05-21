const express = require("express");
const projekIntanceService = require("./projek.service");
const upload = require("../lib/multerConfig");
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
        message: "Project created successfully",
      });
    } catch (error) {
      console.error(error); // Log the error for debugging
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
    res.status(200).json({
      code: 0,
      status: true,
      message: "Project instance started successfully",
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.get("/definition", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await projekIntanceService.getdefinition();
    res.status(200).json({
      code: 0,
      status: true,
      data,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await projekIntanceService.getAll();
    res.status(200).json({
      code: 0,
      status: true,
      data,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
