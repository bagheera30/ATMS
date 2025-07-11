const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/autentication");

const { createinbox, resolve, downloadFile } = require("./inbox.service");
const upload = require("../lib/fileupload");

router.get("/:id/complete", authMiddleware(["manager"]), async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const response = await createinbox(id, req.user.username);

    res.status(201).json(response);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

router.post(
  "/:id/complete",
  upload.any(),
  authMiddleware(["manager"]),
  async (req, res) => {
    try {
      const id = req.params.id;

      // Process files if any
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
        bodyVariables
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

router.post(
  "/:id/resolve",
  upload.any(),
  authMiddleware(["staff"]),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Harus mengirim minimal satu file",
        });
      }

      const id = req.params.id;
      const files = {};

      req.files.forEach((file) => {
        files[file.fieldname] = file;
      });

      const user = await resolve(id, files);
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
