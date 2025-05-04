const express = require("express");
const authMiddleware = require("../middlewares/autentication");
const {
  upsertWorkgroup,
  getAllWorkgroup,
  getByid,
  deleteWorkgroup,
  adduserToWorkgroup,
  deleteuserWorkgroup,
} = require("./workgroup.service");

const router = express.Router();
router.post("/:uuid", authMiddleware(["manager"]), async (req, res) => {
  const data = req.body;
  const uuid = req.params.uuid;
  const username = req.user.username;
  const name = data.name;
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

router.post("/", authMiddleware(["manager"]), async (req, res) => {
  const data = req.body;
  const username = req.user.username;
  const name = data.name;
  const status = data.status;
  const uuid = "";
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

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const workgroup = await getAllWorkgroup();
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
router.get("/:uuid", authMiddleware(["manager"]), async (req, res) => {
  const uuid = req.params.uuid;
  try {
    const workgroup = await getByid(uuid);
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

router.delete("/:uuid", authMiddleware(["manager"]), async (req, res) => {
  const id = req.params.uuid;
  try {
    const user = await deleteWorkgroup(id);
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

router.post("/addUser/:id", authMiddleware(["manager"]), async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const user = await adduserToWorkgroup(data.uuid, id);
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

router.delete(
  "/removeUser/:id",
  authMiddleware(["manager"]),
  async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    try {
      const user = await deleteuserWorkgroup(data.uuid, id);
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

module.exports = router;
