const { Client } = require("minio");

const minioClient = new Client({
  endPoint: process.env.URL_MINIO,
  port: process.env.MINIO_PORT,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

module.exports = minioClient;
