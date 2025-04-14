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

// Serve Swagger UI assets from the correct path
app.use("/api-docs", swaggerUi.serveFiles(swaggerDocument));
app.get("/api-docs", swaggerUi.setup(swaggerDocument));


chokidar.watch(swaggerFilePath).on("all", (event, path) => {
  if (event === "change") {
    console.log("Swagger file changed, reloading...");
    swaggerDocument = loadSwaggerFile();
  }
});

app.use("/auth", require("./auth/auth.controller"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
