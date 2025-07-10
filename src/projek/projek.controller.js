const express = require("express");
const projekIntanceService = require("./projek.service");

const authMiddleware = require("../middlewares/autentication");
const projekService = require("./projek.service");
const router = express.Router();

router.get("/Unassigned", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await projekIntanceService.getbycreated(req.user.username);
    if (data.status == false) {
      return res.status(400).json({
        code: 2,
        status: false,
        message: data.message,
      });
    }
    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

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
    console.error(error);
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
    console.error(error); 
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
    console.error(error); 
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});
router.get("/", authMiddleware(["manager", "staff"]), async (req, res) => {
  const bs = req.query.businessKey;
  const search = req.query.search;

  try {
    let data;

    if (!bs && !search) {
      data = await projekIntanceService.getprojekAll();
    } else if (bs && !search) {
      data = await projekIntanceService.getProjek(bs);
    } else if (!bs && search) {
      data = await projekIntanceService.getAll(search);
    } else {
      data = await projekIntanceService.getProjekWithSearch(bs, search);
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
