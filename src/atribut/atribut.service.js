const { downloadFromMinio } = require("../lib/minio");
const minioClient = require("../lib/minioClient");
const { getAtribut } = require("./atribut.repository");

class atributService {
  async getDownload(uuid) {
    try {
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const res = await getAtribut(uuid);
      console.log(res);
      const fileName = res.value;

      // Membuat PassThrough stream untuk menangani data
      const passThrough = new require("stream").PassThrough();

      // Download file dari MinIO dan pipe ke passThrough stream
      await downloadFromMinio(bucketName, fileName, passThrough);

      return {
        stream: passThrough,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to download file: " + error.message);
    }
  }
}

module.exports = new atributService();
