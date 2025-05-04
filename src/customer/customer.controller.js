const express = require("express");
const {
  getAll,
  getByid,
  updateCustomer,
  create,
  deleteCustomer,
} = require("./customer.service");
const authMiddleware = require("../middlewares/autentication");
const router = express.Router();

router.get("/", authMiddleware(["manager"]), async (req, res) => {
  try {
    console.log(req.query.search);
    const user = await getAll(req.query.search);
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
  // console.log(data);
  const username = req.user.username;
  console.log("s", username);
  try {
    const data = req.body;
    const user = await create(data, username);
    console.log(user);
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
router.patch("/:id", authMiddleware(["manager"]), async (req, res) => {
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
router.delete("/", authMiddleware(["manager"]), async (req, res) => {
  const id = req.query.search;
  try {
    const user = await deleteCustomer(id);
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
module.exports = router;
