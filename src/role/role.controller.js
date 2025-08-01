const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const {
  upsertWorkgroup,
  getAllWorkgroup,
  getByid,
  deleteWorkgroup,
  adduserToWorkgroup,
  deleteuserWorkgroup,
} = require("./role.service");

const router = express.Router();
router.delete("/removeUser", authMiddleware(["manager"]), async (req, res) => {
  const id = req.query.RoleName;
  const data = req.body;
  try {
    const user = await deleteuserWorkgroup(data.uuid, id, req.user.roles);
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
});
router.post("/addUser", authMiddleware(["admin"]), async (req, res) => {
  const id = req.query.RoleName;
  const data = req.body;
  try {
    const user = await adduserToWorkgroup(data.uuid, id, req.user.roles);
    if (!data.uuid) {
      return res.status(400).json({
        code: 2,
        status: false,
        message: "User ID is required",
      });
    }
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
});
router.post("/:RoleName", authMiddleware(["admin"]), async (req, res) => {
  const data = req.body;
  const uuid = req.params.RoleName;
  const username = req.user.username;
  const name = data.RoleName;
  const status = data.status;

  try {
    const user = await upsertWorkgroup(uuid, username, name, status);
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
});

router.post("/", authMiddleware(["admin"]), async (req, res) => {
  const data = req.body;
  const username = req.user.username;
  const name = data.RoleName;
  const status = "inactive";
  const uuid = null;

  try {
    const user = await upsertWorkgroup(uuid, username, name, status);
    if (user.status === false) {
      return res.status(400).json({
        code: 2,
        status: false,
        message: user.message,
      });
    }
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
});

router.get("/", authMiddleware(["manager", "admin"]), async (req, res) => {
  const serch = req.query.RoleName;
  try {
    let workgroup;
    if (serch) {
      workgroup = await getByid(serch);
    } else {
      workgroup = await getAllWorkgroup();
    }

    res.status(200).json({
      workgroup,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

router.delete("/:uuid", authMiddleware(["admin"]), async (req, res) => {
  const id = req.params.uuid;
  try {
    const user = await deleteWorkgroup(id);
    if (user.status === false) {
      return res.status(400).json({
        code: 2,
        status: false,
        message: user.message,
      });
    }
    res.status(200).json({
      code: 1,
      status: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
