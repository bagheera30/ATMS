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

async function downloadFromMinio({ bucketName, fileName }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    minioClient
      .getObject(bucketName, fileName)
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", (err) => reject(err));
  });
}
module.exports = { uploadToMinio, downloadFromMinio };
