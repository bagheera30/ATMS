const path = require("path");
const fs = require("fs");
const FormData = require("form-data"); // <-- Tambahkan ini
const {
  getAllBycustomerId,
  getProjek,
  createProjek,
  upsert,
} = require("./projekintance.repository");
const uploadToMinio = require("../lib/minioUpload");
const { default: axios } = require("axios");

class ProjekIntanceService {
  async getAllProjek(customer) {
    if (!customer) {
      throw new Error("please complete the form");
    }
    try {
      const user = await getAllBycustomerId(customer);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getProjek(uuid) {
    if (!uuid) {
      throw new Error("please complete the form");
    }
    try {
      const user = await getProjek(uuid);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async createProjek(data, file) {
    if (!data || !file) {
      throw new Error("Please complete the form and upload a BPMN file.");
    }

    try {
      const projekId = data.businesskey;
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const objectName = `${projekId}_${file.originalname}`;
      console.log(objectName);

      // Upload file ke MinIO
      await uploadToMinio(file.buffer, bucketName, objectName);

      const urlcamund = process.env.CAMUNDA_URL;

      // Buat FormData untuk kirim ke Camunda
      const formData = new FormData();
      formData.append(
        "upload", // Nama field sesuai API Camunda
        file.buffer,
        {
          filename: objectName,
          contentType: "application/xml", // atau 'text/xml' tergantung jenis file BPMN
        }
      );

      formData.append("deployment-name", data.name); // opsional
      formData.append("deployment-source", "process application"); // opsional
      formData.append("deploy-changed-only", "true"); // opsional;

      // Kirim ke Camunda
      const camunda = await axios.post(
        `${urlcamund}/deployment/create`,
        formData,
        {
          headers: {
            ...formData.getHeaders(), // otomatis set Content-Type ke multipart/form-data
          },
        }
      );


      const deployedProcesses = camunda.data;
      const processDefinitions = deployedProcesses.deployedProcessDefinitions;
      const processDefinitionKeys = Object.keys(processDefinitions);

      if (processDefinitionKeys.length === 0) {
        throw new Error("No process definitions deployed");
      }

      const processDefinitionId =
        processDefinitions[processDefinitionKeys[0]].id;

      // Start process instance
      const contractNumber = "CN-12345"; // Sesuaikan sumber variabel ini
      const startResponse = await axios.post(
        `${urlcamund}/process-definition/${processDefinitionId}/start`,
        {
          variables: {
            contractNumber: { value: contractNumber, type: "String" },
          },
        }
      );

      // const customer = data.customer;
      // const db = await upsert(data, customer);

      return {
        message: "Deployment and process instance started",
        deployment: deployedProcesses.deployedProcessDefinitions,
        processInstance: startResponse.data.definitionKey,
      };
    } catch (error) {
      console.error("Error during deployment:", error.message);
      const isMulterError = error.message === "Only .bpmn files are allowed";
      return {
        error: isMulterError ? error.message : "Deployment failed",
        details: error.message,
      };
    }
  }
}

module.exports = new ProjekIntanceService();
