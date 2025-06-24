// inbox.router.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");
const multer = require("multer");
const upload = multer();

router.post(
  "/:id",
  authMiddleware(["manager", "user"]),
  upload.any(), // Handle any file uploads
  async (req, res) => {
    try {
      const id = req.params.id;
      const variables = req.body.variables || {};
      const files = {};

      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          files[file.fieldname] = file;
        });
      }

      const response = await inboxService.createinbox(
        id,

        req.user.username,
        variables,
        files
      );

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
