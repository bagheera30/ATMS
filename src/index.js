const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const chokidar = require("chokidar");
const express = require("express");

const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
const JWT_SECRET = process.env.JWT_SECRET;
require("dotenv").config();

const port = process.env.PORT || 5000;
const swaggerFilePath = path.join(__dirname, "doc/swagger.yaml");

// Fungsi untuk memuat file Swagger YAML
function loadSwaggerFile() {
  try {
    const fileContents = fs.readFileSync(swaggerFilePath, "utf8");
    return YAML.parse(fileContents);
  } catch (error) {
    console.error("Error loading Swagger file:", error);
    return null;
  }
}

let swaggerDocument = loadSwaggerFile();

// Endpoint untuk Swagger UI
app.use("/api-docs", swaggerUi.serve, (req, res, next) => {
  // Setup Swagger UI dengan dokumen terbaru
  swaggerUi.setup(swaggerDocument)(req, res, next);
});

// Pantau perubahan pada file YAML
chokidar.watch(swaggerFilePath).on("all", (event, path) => {
  if (event === "change") {
    console.log("Swagger file changed, reloading...");
    swaggerDocument = loadSwaggerFile();
  }
});

app.get("/", (req, res) => {
  res.send("Hello, untuk menggunakan api jika mencari produk maka harus /auth");
});

// app.use("/user", require("./user/user.controller"))
app.use("/auth", require("./auth/auth.controller"));
// app.use("/user", require("./user/user.controller"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
