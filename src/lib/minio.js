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

async function downloadFromMinio(bucketName, fileName, writableStream) {
  return new Promise((resolve, reject) => {
    minioClient
      .getObject(bucketName, fileName)
      .then((stream) => {
        stream.pipe(writableStream);
        stream.on("end", () => resolve());
        stream.on("error", (err) => reject(err));
      })
      .catch((err) => reject(err));
  });
}
module.exports = { uploadToMinio, downloadFromMinio };
