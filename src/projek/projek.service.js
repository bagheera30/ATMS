const { getalltask } = require("../task/task.service");
const { findUserAllByUsername } = require("../user/user.repository");
const {
  getAllBycustomerId,
  getProjek,
  upsert,
  getAllProjek,
  getAll,
  getbycreatedBy,
  getwgprojek,
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
  async getwg(user) {
    console.log(user);
    const lower = user.username.toLowerCase();
    const userdata = await findUserAllByUsername(lower);
    console.log(userdata);

    if (!userdata) {
      return {
        code: 1,
        status: false,
        message: "user not found",
      };
    }

    // Ambil workgroup dan proses dengan map
    const workgroups = userdata.workgroup.map(async (wg) => {
      const wgp = await getwgprojek(wg);
      console.log(wgp.length);
      if (wgp.length > 0) {
        const tasks = await getalltask(wgp[0].businessKey, user.roles);

        // 1. Filter task yang resolve > 0, lalu jumlahkan nilainya
        const Resolve = tasks
          .filter((task) => task.resolve > 0)
          .reduce((sum, task) => sum + task.resolve, 0);

        return {
          businessKey: wgp[0].businessKey,
          nama: wgp[0].nama,
          customer: wgp[0].customer,
          status: wgp[0].status,
          Resolve,
        };
      }
      return null;
    });

    const data = (await Promise.all(workgroups)).filter(Boolean);

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
    if (!uuid) throw new Error("UUID is required");
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
      data.wgName = `${data.name}_${data.businesskey}`;
      await upsert(data, customer, username);
      return startResponse.data;
    }
    throw new Error(
      `Failed to start process instance: ${startResponse.statusText}`
    );
  }
}

module.exports = new ProjekIntanceService();
