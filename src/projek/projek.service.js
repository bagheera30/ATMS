const path = require("path");
const fs = require("fs");
const FormData = require("form-data"); // <-- Tambahkan ini
const {
  getAllBycustomerId,
  getProjek,
  createProjek,
  upsert,
  getAllProjek,
} = require("./projek.repository");
const uploadToMinio = require("../lib/minioUpload");
const { default: axios } = require("axios");

class ProjekIntanceService {
  async getAll() {
    try {
      const urlcamund = process.env.CAMUNDA_URL;
      const data = await getAllProjek(); // asumsi ini async

      const promises = data.map(async (item) => {
        // Ambil process instance berdasarkan businessKey
        const processInstanceRes = await axios.get(
          `${urlcamund}/process-instance?businessKey=${item.businessKey}`
        );

        const processInstances = processInstanceRes.data || [];
        const processInstanceId =
          processInstances.length > 0 ? processInstances[0].id : null;

        // Ambil task berdasarkan processInstanceId jika ada
        let tasks = [];
        if (processInstanceId) {
          const taskRes = await axios.get(
            `${urlcamund}/task?processInstanceId=${processInstanceId}`
          );
          tasks = taskRes.data || [];
        }

        return {
          businessKey: item.businessKey,
          nama: item.name,
          customer: item.customer,
          status: item.status,
          processInstanceId: processInstanceId,
          owner: tasks.length > 0 ? tasks[0].owner : null,
          created:
            tasks.length > 0
              ? new Date(tasks[0].created).toISOString().split("T")[0]
              : null,
        };
      });

      const resultdata = await Promise.all(promises);

      console.log(resultdata);
      return resultdata;
    } catch (error) {
      console.error("Error in getAll():", error.message);
      throw error;
    }
  }
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

  async createProjek(data, file, username) {
    if (!data || !file) {
      throw new Error("Please complete the form and upload a BPMN file.");
    }

    try {
      const projekId = data.businesskey;
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const objectName = `${projekId}_${file.originalname}`;

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

      // const db = await upsert(data, customer, username);

      return {
        message: "Deployment and process instance started",
      };
    } catch (error) {
      console.error("Error during deployment:", error.message);
      const isMulterError = error.message === "Only .bpmn files are allowed";
      return {
        error: isMulterError ? error.message : "Deployment failed",
        details: error.message,
      };
    } finally {
      file.buffer = null;
    }
  }
  async getdefinition() {
    try {
      const urlcamund = process.env.CAMUNDA_URL;
      const processDefinitionResponse = await axios.get(
        `${urlcamund}/process-definition`,
        {
          params: {
            latestVersion: true,
          },
        }
      );
      
      const response = processDefinitionResponse.data;
      con
      return response;
    } catch (error) {
      throw error;
    }
  }
  async startIntance(data) {
    if (!data) {
      throw new Error("please complete the form");
    }
    try {
      // 1. Ambil definisi proses terbaru berdasarkan key
      const processDefinitionResponse = await axios.get(
        `${urlcamund}/process-definition`,
        {
          params: {
            key: data.key,
            latestVersion: true,
          },
        }
      );

      // 2. Verifikasi response
      if (!processDefinitionResponse.data) {
        throw new Error("Process definition tidak ditemukan");
      }
      const processDefinitionId = processDefinitionResponse.data.id;
      // Start process instance
      const startResponse = await axios.post(
        `${urlcamund}/process-definition/${processDefinitionId}/start`,
        {
          businessKey: data.businesskey,
        }
      );

      const customer = data.customer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProjekIntanceService();
