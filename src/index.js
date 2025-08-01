const express = require("express");

const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

require("dotenv").config();

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello, untuk menggunakan api jika mencari produk maka harus /auth");
});

app.use("/auth", require("./auth/auth.controller"));
app.use("/user", require("./user/user.controller"));
app.use("/customers", require("./customer/customer.controller"));
app.use("/workgroup", require("./workgroup/workgroup.controlle"));
app.use("/role", require("./role/role.controller"));
app.use("/vendor", require("./vendor/vendor.controller"));
app.use("/projek", require("./projek/projek.controller"));
app.use("/task", require("./task/task.contoller"));
app.use("/inbox", require("./inbox/inbox.controller"));
app.use("/atribut", require("./atribut/atribut.controller"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
