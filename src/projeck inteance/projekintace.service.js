const path = require("path");
const fs = require("fs");
const {
  getAllBycustomerId,
  getProjek,
  createProjek,
} = require("./projekintance.repository");

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
  async createProjek(data, username, bpmnFileName) {
    if (!data || !username || !bpmnFileName) {
      throw new Error("Please complete the form and upload a BPMN file.");
    }

    const { uuid, projectName } = data;

    try {
      const bpmnFilePath = path.resolve(
        __dirname,
        "..",
        "upload",
        bpmnFileName
      );

      if (!fs.existsSync(bpmnFilePath)) {
        throw new Error(`BPMN file not found at path: ${bpmnFilePath}`);
      }

      // --- 1. Deploy BPMN ke Camunda ---
      const formData = new FormData();
      formData.append("deployment-name", data.name || "default-process");
      formData.append("enable-duplicate-filtering", "true");
      formData.append("deploy-changed-only", "false");
      formData.append("processes", fs.createReadStream(bpmnFilePath), {
        filename: bpmnFileName,
        contentType: "text/xml",
      });

      const deployResponse = await axios.post(
        `${CAMUNDA_API_URL}/deployment/create`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      const deploymentId = deployResponse.data.id;

      // --- 2. Ambil process definition ---
      const defRes = await axios.get(
        `${CAMUNDA_API_URL}/process-definition?deploymentId=${deploymentId}`
      );
      const processDefinitionKey = defRes.data[0].key;

      // --- 3. Start Process Instance ---
      const startRes = await axios.post(
        `${CAMUNDA_API_URL}/process-definition/key/${processDefinitionKey}/start`,
        {
          variables: {}, // bisa tambah variabel awal jika diperlukan
        }
      );

      const processInstanceId = startRes.data.processInstanceId;


      

      const createdProjek = await createProjek(projekData, username);
      return createdProjek;
    } catch (error) {
      console.error(
        "Error deploying or starting Camunda process:",
        error.message || error
      );
      throw new Error("Camunda deployment failed: " + error.message);
    }
  }
}
