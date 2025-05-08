// getInstance.js
const { Client } = require("minio");

// Konfigurasi MinIO
const minioClient = new Client({
  endPoint: process.env.URL_MINIO, // Ganti jika bukan localhost
  port:process.env.MINIO_PORT, // Port default MinIO
  useSSL: false, // true jika pakai HTTPS
  accessKey: process.env.MINIO_ACCESS_KEY, // Ganti dengan accessKey kamu
  secretKey: process.env.MINIO_SECRET_KEY, // Ganti dengan secretKey kamu
});

module.exports = minioClient;
