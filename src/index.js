const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
require("dotenv").config();

const port = process.env.PORT || 5000;

// Gunakan path absolut untuk file swagger
// const swaggerFilePath = path.join(__dirname, "doc", "swagger.yaml");

try {
  const swaggerFilePath = path.join(__dirname, "doc", "swagger.yaml");
  const swaggerFile = fs.readFileSync(swaggerFilePath, "utf8");
  const swaggerDocument = YAML.parse(swaggerFile);

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/auth", require("./auth/auth.controller"));

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("Error loading Swagger file:", error);
  console.log("Pastikan file doc/swagger.yaml ada di direktori proyek Anda");
  process.exit(1); // Keluar dari proses jika file tidak ditemukan
}
