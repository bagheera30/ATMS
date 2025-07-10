const minioClient = require("./minioClient");

async function uploadToMinio(fileBuffer, bucketName, objectName) {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }

  await minioClient.putObject(bucketName, objectName, fileBuffer);
}

async function getPresignedUrl(bucketName, fileName, expirySeconds = 300) {
  return await minioClient.presignedGetObject(
    bucketName,
    fileName,
    expirySeconds
  );
}

async function preview(bucketName, fileName) {
  return await minioClient.presignedGetObject(bucketName, fileName);
}
module.exports = { uploadToMinio, getPresignedUrl, preview };
