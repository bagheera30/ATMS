const {
  getAllBycustomerId,
  getProjek,
  upsert,
  getAllProjek,
  getAll,
  getbycreatedBy,
} = require("./projek.repository");
const { default: axios } = require("axios");

class ProjekIntanceService {
  async getbycreated(username) {
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
  }

  async getprojekAll() {
    return await getAll();
  }

  async getAll(search) {
    try {
      const data = await getAllProjek(search);
      const resultdata = await Promise.all(
        data.map(async (item) => ({
          businessKey: item.businessKey,
          nama: item.name,
          customer: item.customer,
          status: item.status,
        }))
      );
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
    return await getAllBycustomerId(customer);
  }

  async getProjek(uuid) {
    if (!uuid) {
      throw new Error("please complete the form");
    }
    return await getProjek(uuid);
  }

  async getDetailDefinition(uuid) {
    if (!uuid) {
      throw new Error("please complete the form");
    }
    const df = await axios.get(
      `${process.env.URL_CAMUNDA}/process-definition/${uuid}/xml`
    );
    return df.data.bpmn20Xml;
  }

  async getdefinition() {
    const urlcamund = process.env.URL_CAMUNDA;
    const processDefinitionResponse = await axios.get(
      `${urlcamund}/process-definition`,
      {
        params: {
          latestVersion: true,
        },
      }
    );
    return processDefinitionResponse.data.filter((process) =>
      process.key.toLowerCase().includes("software_development_lifecycle")
    );
  }

  async startIntance(data, username) {
    if (!data) {
      throw new Error("please complete the form");
    }

    const urlcamund = process.env.URL_CAMUNDA;
    const startResponse = await axios.post(
      `${urlcamund}/process-definition/key/${data.key}/start`,
      {
        businessKey: data.businesskey,
      }
    );

    if (startResponse.status >= 200 && startResponse.status < 300) {
      const customer = data.customer;
      await upsert(data, customer, username);
      return startResponse.data;
    }
    throw new Error(
      `Failed to start process instance: ${startResponse.statusText}`
    );
  }
}

module.exports = new ProjekIntanceService();
