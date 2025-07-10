const { getAtribut } = require("./atribut.repository");
const { getPresignedUrl } = require("../lib/minio");

class atributService {
  async getDownload(uuid) {
    try {
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const res = await getAtribut(uuid);

      if (!res || !res.value) {
        throw new Error("Atribut tidak ditemukan");
      }

      const fileName = res.value;

      const presignedUrl = await getPresignedUrl(bucketName, fileName, 300); 

      return {
        url: presignedUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to generate download URL: " + error.message);
    }
  }
}

module.exports = new atributService();
