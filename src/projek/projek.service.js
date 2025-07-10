const path = require("path");
const fs = require("fs");
const FormData = require("form-data"); // <-- Tambahkan ini
const {
  getAllBycustomerId,
  getProjek,
  createProjek,
  upsert,
  getAllProjek,
  getfile,
  getAll,
  getbycreatedBy,
} = require("./projek.repository");
const uploadToMinio = require("../lib/minio");
const { default: axios } = require("axios");

class ProjekIntanceService {
  async getbycreated(username) {
    try {
      const data = await getbycreatedBy(username);
      if (!data) {
        return {
          code: 1,
          status: false,
          message: "user not found",
        };
      }
      return {
        code: 0,
        status: true,
        message: "sucess",
        data,
      };
    } catch (error) {
      throw error;
    }
  }
  async getprojekAll() {
    try {
      const result = await getAll();
      return result;
    } catch (error) {
      throw error;
    }
  }
  async getAll(search) {
    try {
      const data = await getAllProjek(search);
      const promises = data.map(async (item) => {
        return {
          businessKey: item.businessKey,
          nama: item.name,
          customer: item.customer,
          status: item.status,
        };
      });

      const resultdata = await Promise.all(promises);

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

  async getDetailDefinition(uuid) {
    if (!uuid) {
      throw new Error("please complete the form");
    }
    try {
      const df = await axios.get(
        `${process.env.URL_CAMUNDA}/process-definition/${uuid}/xml`
      );
      const bpmxl = df.data.bpmn20Xml;

      return bpmxl;
    } catch (error) {
      throw error;
    }
  }
  async createProjek(data, file, username) {
    if (!data) {
      throw new Error("Please complete the form and upload a BPMN file.");
    }

    try {
      const projekId = data.businesskey;
      const bucketName = process.env.MINIO_BUCKET_NAME;
      const objectName = `${projekId}_${file.originalname}`;

      await uploadToMinio(file.buffer, bucketName, objectName);

      const urlcamund = process.env.URL_CAMUNDA;

      const formData = new FormData();
      formData.append("upload", file.buffer, {
        filename: objectName,
        contentType: "application/xml",
      });

      formData.append("deployment-name", data.name); 
      formData.append("deployment-source", "process application"); 
      formData.append("deploy-changed-only", "true"); 

      const camunda = await axios.post(
        `${urlcamund}/deployment/create`,
        formData,
        {
          headers: {
            ...formData.getHeaders(), 
          },
        }
      );

      const deployedProcesses = camunda.data;
      const processDefinitions = deployedProcesses.deployedProcessDefinitions;
      const processDefinitionKeys = Object.keys(processDefinitions);

      if (processDefinitionKeys.length === 0) {
        throw new Error("No process definitions deployed");
      }

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
      const urlcamund = process.env.URL_CAMUNDA;
      const processDefinitionResponse = await axios.get(
        `${urlcamund}/process-definition`,
        {
          params: {
            latestVersion: true,
          },
        }
      );

      const filteredProcesses = processDefinitionResponse.data.filter(
        (process) =>
          process.key.toLowerCase().includes("software_development_lifecycle")
      );

      return filteredProcesses;
    } catch (error) {
      throw error;
    }
  }
  async startIntance(data, username) {
    if (!data) {
      throw new Error("please complete the form");
    }

    const urlcamund = process.env.URL_CAMUNDA;
    try {
      const startResponse = await axios.post(
        `${urlcamund}/process-definition/key/${data.key}/start`,
        {
          businessKey: data.businesskey,
        }
      );

      if (startResponse.status >= 200 && startResponse.status < 300) {
        const customer = data.customer;
        const startdata = await upsert(data, customer, username);

        return startResponse.data; // Optional: return response data jika diperlukan
      } else {
        throw new Error(
          `Failed to start process instance: ${startResponse.statusText}`
        );
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProjekIntanceService();
