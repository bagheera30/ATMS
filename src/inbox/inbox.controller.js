const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");

const {
  createinbox,
  downloadFile,
  complate,
} = require("./inbox.service");
const upload = require("../lib/fileupload");

router.get("/:id/complete", authMiddleware(["manager"]), async (req, res) => {
  try {
    const id = req.params.id;
    const response = await complate(id, req.user.username);

    res.status(200).json(response); // Changed from 201 to 200 for successful GET
  } catch (error) {
    console.error("Error completing task:", error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

router.post(
  "/:id/complete",
  upload.any(),
  authMiddleware(["manager", "staff"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const files = {};

      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          files[file.fieldname] = file;
        });
      }

      const bodyVariables = req.body || {};
      const response = await createinbox(
        id,
        req.user.username,
        files,
        bodyVariables,
        req.user.roles
      );

      res.status(200).json(response); // Changed from 201 to 200 since we're not necessarily creating a new resource
    } catch (error) {
      console.error("Error completing task:", error);
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }
);



router.get("/", async (req, res) => {
  const id = req.query.fileName;
  if (!id) {
    return res.status(400).json({
      // Added validation for missing fileName
      code: 2,
      status: false,
      message: "fileName query parameter is required",
    });
  }

  try {
    const url = await downloadFile(id);
    if (!url) {
      return res.status(404).json({
        // Added 404 for not found
        code: 2,
        status: false,
        message: "File not found",
      });
    }
    res.redirect(url);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
