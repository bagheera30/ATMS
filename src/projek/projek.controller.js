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
router.get("/definition/:id", authMiddleware(["manager"]), async (req, res) => {
  try {
    const bpmxl = await projekIntanceService.getDetailDefinition(req.params.id);
    res.status(200).json({
      code: 0,
      status: true,
      bpmxl,
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

    // Logika pengambilan data yang lebih jelas
    if (!bs && !search) {
      // Jika tidak ada parameter query, ambil semua projek
      data = await projekIntanceService.getprojekAll();
    } else if (bs && !search) {
      // Jika hanya ada businessKey, ambil projek berdasarkan businessKey
      data = await projekIntanceService.getProjek(bs);
    } else if (!bs && search) {
      // Jika hanya ada search, cari projek berdasarkan kata kunci
      data = await projekIntanceService.getAll(search);
    } else {
      // Jika ada kedua parameter (bs dan search), tentukan logika yang sesuai
      // Ini bisa disesuaikan dengan kebutuhan bisnis
      // Contoh: cari dalam projek dengan businessKey tertentu
      data = await projekIntanceService.getProjekWithSearch(bs, search);
      // Atau bisa juga mengembalikan error jika kombinasi tidak didukung
      // throw new Error("Kombinasi parameter businessKey dan search tidak didukung");
    }

    res.status(200).json({
      code: 0,
      status: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching project data:", error);
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message || "Terjadi kesalahan saat memproses permintaan",
    });
  }
});



module.exports = router;
