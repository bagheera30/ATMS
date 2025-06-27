const express = require("express");
const { getDownload } = require("./atribut.service");

const router = express.Router();

router.get("/:id/download", async (req, res) => {
  const id = req.params.id;
  console.log("Download request for ID:", id);

  try {
    const { url } = await getDownload(id);

    // Redirect client ke MinIO dengan presigned URL
    return res.redirect(url);
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
