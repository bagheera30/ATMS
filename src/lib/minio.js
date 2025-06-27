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
  try {
    const url = await minioClient.presignedGetObject(
      bucketName,
      fileName,
      expirySeconds
    );
    return url;
  } catch (err) {
    throw new Error("Gagal mendapatkan presigned URL: " + err.message);
  }
}


module.exports = { uploadToMinio, getPresignedUrl };
