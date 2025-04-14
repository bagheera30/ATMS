const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const express = require("express");
const cors = require("cors");

// Tidak menggunakan chokidar di production karena Vercel adalah environment serverless
const isProduction = process.env.NODE_ENV === "production";

const app = express();

app.use(express.json());
app.use(cors());
require("dotenv").config();

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

const swaggerDocument = loadSwaggerFile();

// Endpoint untuk Swagger UI
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/auth", require("./auth/auth.controller"));

// Handler untuk Vercel
module.exports = app;

// Local server hanya dijalankan di development
if (!isProduction) {
  const port = process.env.PORT || 5000;

  // Di development, kita bisa menggunakan chokidar untuk watch file changes
  if (!isProduction) {
    const chokidar = require("chokidar");
    chokidar.watch(swaggerFilePath).on("all", (event, path) => {
      if (event === "change") {
        console.log("Swagger file changed, reloading...");
        swaggerDocument = loadSwaggerFile();
      }
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
