const express = require("express");
const { getDownload } = require("./atribut.service");
const router = express.Router();

router.get("/:id/download", async (req, res) => {
  const id = req.params.id;

  try {
    const { url } = await getDownload(id);
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
