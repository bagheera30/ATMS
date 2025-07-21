const express = require("express");
const {
  getAll,
  getByid,
  updateCustomer,
  create,
  deleteCustomer,
  getprocessintance,
} = require("./customer.service");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    const user = await getAll();
    res.status(200).json({
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

router.get("/process", authMiddleware(["manager"]), async (req, res) => {
  try {
    const data = await getprocessintance();
    res.status(200).json({
      data,
    });
  } catch (error) {
    res.status(400).json({
      code: 2,
      status: false,
      message: error.message,
    });
  }
});
router.get("/:id", authMiddleware(["manager"]), async (req, res) => {
  try {
    const user = await getByid(req.params.id);
    res.status(200).json({
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
  const username = req.user.username;
  try {
    const data = req.body;
    const user = await create(data, username);
    res.status(200).json({
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
router.post("/:id", authMiddleware(["manager"]), async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const username = req.user.username;
  try {
    const user = await updateCustomer(id, data, username);
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
router.delete("/:id", authMiddleware(["manager"]), async (req, res) => {
  const id = req.params.id;
  try {
    const user = await deleteCustomer(id);
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
