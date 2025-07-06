// inbox.router.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");

const { createinbox } = require("./inbox.service");
const upload = require("../lib/fileupload");

router.post(
  "/:id",
  authMiddleware(["manager", "user"]),
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

module.exports = router;
