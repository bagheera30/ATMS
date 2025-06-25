const express = require("express");
const projekIntanceService = require("./projek.service");

const authMiddleware = require("../middlewares/autentication");
const router = express.Router();



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

router.get("/", authMiddleware(["manager", "user"]), async (req, res) => {
  const bs = req.query.businessKey;
  const search = req.query.search;

  try {
    let data;

    // Jika businessKey tidak diberikan, ambil semua projek
    if (!bs) {
      data = await projekIntanceService.getAll(search);
    } else {
      // Jika businessKey diberikan, ambil projek berdasarkan businessKey
      data = await projekIntanceService.getProjek(bs);
    }

    res.status(200).json({
      code: 0,
      status: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching project data:", error); // Lebih detail dalam log
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message || "Terjadi kesalahan saat memproses permintaan",
    });
  }
});

router.post("/dowload/:filename", async (req, res) => {
  const uuid = req.params.filename;
  try {
    const file = await projekIntanceService.getDownload(uuid);
    res.status(200).json({
      code: 0,
      status: true,
      file,
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
