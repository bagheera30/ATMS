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

try {
  const swaggerFilePath = path.join(__dirname, "doc", "swagger.yaml");
  const swaggerFile = fs.readFileSync(swaggerFilePath, "utf8");
  const swaggerDocument = YAML.parse(swaggerFile);

  // Swagger UI with proper options
  const options = {
    explorer: true,
    swaggerOptions: {
      validatorUrl: null, // Disable validator if not needed
    },
  };

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, options)
  );
  app.use("/auth", require("./auth/auth.controller"));

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("Error loading Swagger file:", error);
  console.log("Pastikan file doc/swagger.yaml ada di direktori proyek Anda");
  process.exit(1);
}
