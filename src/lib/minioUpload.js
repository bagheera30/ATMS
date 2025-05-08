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

module.exports = uploadToMinio;
