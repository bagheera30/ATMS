const { default: axios } = require("axios");
const { detectVariableType } = require("../lib/typecamund");
const { upsertatribut } = require("./inbox.repository");

class InboxService {
  async createinbox(id, data, username, variables) {
    const camundaURL = process.env.URL_CAMUNDA;
    try {
      if (!variables || Object.keys(variables).length === 0) {
        return res.status(400).json({ error: "Variables required" });
      }
      const camundaVariables = {};
      for (const [key, value] of Object.entries(variables)) {
        const type = detectVariableType(value);

        camundaVariables[key] = { value, type };

        // Handle khusus untuk tipe Object/JSON
        if (type === "Object") {
          camundaVariables[key].valueInfo = {
            objectTypeName: "java.util.HashMap",
            serializationDataFormat: "application/json",
          };
        }

        // Handle khusus untuk tipe Date
        if (value instanceof Date) {
          camundaVariables[key].value = value.toISOString();
        }
      }

      // 3. Kirim ke Camunda API
      const response = await axios.post(
        `
      ${camundaURL}/task/${taskId}/complete`,
        { variables: camundaVariables }
      );
      const uuid = "";
      const task = await axios.get(`${camundaURL}/task/${id}`);
      const atribut = await upsertatribut(
        data,
        uuid,
        value,
        task.data.name,
        username,
        task.data.businessKey
      );

      return {
        success: true,
        message: "Task completed",
        data: response.data,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
module.exports = inboxService;
