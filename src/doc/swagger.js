const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "1.0.0",
      description: "API documentation for Express application",
    },
    servers: [
      {
        url: "http://localhost:3000", // Ganti dengan URL hosting setelah deploy
      },
    ],
  },
  apis: ["./index.js"], // Lokasi file yang berisi definisi endpoint
};

const specs = swaggerJsDoc(options);
module.exports = specs;
