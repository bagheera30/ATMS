const minioClient = require("./minioClient");

async function uploadToMinio(fileBuffer, bucketName, objectName) {
  // Pastikan bucket ada
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`Bucket "${bucketName}" created`);
  }

  // Upload file
  await minioClient.putObject(bucketName, objectName, fileBuffer);
  console.log(`File "${objectName}" uploaded to bucket "${bucketName}"`);
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
