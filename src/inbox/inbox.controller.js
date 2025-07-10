// inbox.router.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");

const { createinbox, resolve, downloadFile } = require("./inbox.service");
const upload = require("../lib/fileupload");

router.post(
  "/:id",
  authMiddleware(["manager", "staff"]),
  upload.any(), // Handle any file uploads
  async (req, res) => {
    try {
      // Validasi harus ada file yang diupload
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Harus mengirim minimal satu file",
        });
      }

      const id = req.params.id;
      const files = {}; // Hanya proses files

      req.files.forEach((file) => {
        files[file.fieldname] = file;
      });

      // Panggil service tanpa variables
      const response = await createinbox(id, req.user.username, files);

      res.status(201).json(response);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }
);

router.post(
  "/:id/resolve",
  upload.any(),
  authMiddleware(["staff"]),
  async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    try {
      const user = await resolve(id, data);
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

router.get("/", async (req, res) => {
  const id = req.query.fileName;
  try {
    const url = await downloadFile(id);
    res.redirect(url);
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
