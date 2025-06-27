const express = require("express");
const { getDownload } = require("./atribut.service");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();

router.get("/:id/download", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const { stream, fileName } = await getDownload(id);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    stream.pipe(res);
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});
module.exports = router;