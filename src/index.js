import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import path from "path";
import chokidar from "chokidar";
const express = require("express");

const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
const dot = require("dotenv").config();

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
  res.send(
    "Hello, untuk menggunakan api jika mencari produk maka harus /user,/transaksi"
  );
});
// app.use("/user", require("./user/user.controller"))
app.use("/auth", require("./auth/auth.controller"));
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
