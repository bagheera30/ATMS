const { default: axios } = require("axios");
const { upsertComment, getcommen } = require("./task.repository");
const QueryString = require("qs");
const { findUserAllByUsername } = require("../user/user.repository");
const { getAllProjek } = require("../projek/projek.repository");

class TaskService {
  async getalltask(businessKey, user) {
    if (!businessKey) {
      throw new Error("Please complete the query");
    }
    try {
      const urlCamunda = process.env.URL_CAMUNDA;

      const params = {
        processInstanceBusinessKey: businessKey,
      };

      // Jika role adalah 'staf' dan ada userId, tambahkan assignee
      if (user.roles === "staff" && user.username) {
        params.assignee = user.username;
      }
      const response = await axios.get(`${urlCamunda}/task`, {
        params: params,
      });

      const projek = await getAllProjek(businessKey);
      const tasks = response.data;
      let count = 0;
      let cp = 0;
      const filteredTasks = tasks.map((task) => {
        const processDefinitionParts = task.processDefinitionId
          ? task.processDefinitionId.split(":")
          : [];
        const processDefinitionName =
          processDefinitionParts.length > 0 ? processDefinitionParts[0] : null;
        const processNameParts = processDefinitionName.split("_");
        const designPart = processNameParts[2].split(":")[0];
        if (task.delegationState === "RESOLVED") {
          count++;
        } else if (task.delegationState === "PENDING") {
          cp++;
        } else {
          count = 0;
          cp = 0;
        }
        return {
          id: task.id,
          name: task.name,
          owner: task.owner,
          assignee: task.assignee,
          created: task.created,
          followUp: task.followUp,
          due_date: task.due,
          projek: projek[0].name,
          customer: projek[0].customer,
          delegation: task.delegationState,
          resolve: count,
          pending: cp,
          tahap: designPart,
        };
      });

      return filteredTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        return {
          status: error.response.status,
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        };
      } else {
        return {
          status: 500,
          error: "Failed to fetch tasks from Camunda. Status: 500",
        };
      }
    }
  }

  async getalltaskWG(businessKey) {
    if (!businessKey) {
      throw new Error("Please complete the query");
    }
    try {
      const urlCamunda = process.env.URL_CAMUNDA;

      // Siapkan parameter dasar
      const response = await axios.get(`${urlCamunda}/task`, {
        processInstanceBusinessKey: businessKey,
      });

      const projek = await getAllProjek(businessKey);
      const tasks = response.data;
      let count = 0;
      const filteredTasks = tasks.map((task) => {
        const processDefinitionParts = task.processDefinitionId
          ? task.processDefinitionId.split(":")
          : [];
        const processDefinitionName =
          processDefinitionParts.length > 0 ? processDefinitionParts[0] : null;
        const processNameParts = processDefinitionName.split("_");
        const designPart = processNameParts[2].split(":")[0];
        if (task.delegationState === "RESOLVED") {
          count++;
        }
        return {
          id: task.id,
          name: task.name,
          owner: task.owner,
          assignee: task.assignee,
          created: task.created,
          followUp: task.followUp,
          due_date: task.due,
          projek: projek[0].name,
          customer: projek[0].customer,
          delegation: task.delegationState,
          resolve: count,
          tahap: designPart,
        };
      });

      return filteredTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        return {
          status: error.response.status,
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        };
      } else {
        return {
          status: 500,
          error: "Failed to fetch tasks from Camunda. Status: 500",
        };
      }
    }
  }

  async getasbyinbox(username) {
    try {
      const urlcamund = process.env.URL_CAMUNDA;

      const [responseAssignee, responseOwner] = await Promise.all([
        axios.get(`${urlcamund}/task`, { params: { assignee: username } }),
        axios.get(`${urlcamund}/task`, {
          params: {
            owner: (
              await findUserAllByUsername(username.toLowerCase())
            ).fullName,
          },
        }),
      ]);

      const combinedTasks = [...responseAssignee.data, ...responseOwner.data];
      const uniqueTasks = Array.from(
        new Map(combinedTasks.map((task) => [task.id, task])).values()
      );

      const tasksWithProjects = await Promise.all(
        uniqueTasks.map(async (task) => {
          try {
            const processInstance = await axios.get(
              `${urlcamund}/process-instance/${task.processInstanceId}`
            );
            const businessKey = processInstance.data.businessKey;

            const projek = businessKey ? await getAllProjek(businessKey) : null;

            return {
              id: task.id,
              active: task.taskDefinitionKey,
              name: task.name,
              owner: task.owner,
              assignee: task.assignee,
              created: task.created,
              followUp: task.followUp,
              due_date: task.due,
              delegation: task.delegationState,
              businessKey: businessKey,
              projek: projek[0] || null,
            };
          } catch (error) {
            console.error(`Error processing task ${task.id}:`, error);
            return {
              ...task,
              businessKey: null,
              projek: null,
              error: `Failed to load project data: ${error.message}`,
            };
          }
        })
      );

      return tasksWithProjects;
    } catch (error) {
      console.error("Error in getasbyinbox:", error);
      throw new Error(`Failed to fetch inbox: ${error.message}`);
    }
  }

  async assignee(username, taskid) {
    try {
      const cm = process.env.URL_CAMUNDA;
      const response = await axios.post(`${cm}/task/${taskid}/claim`, {
        userId: username,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch tasks from Camunda. Status: 500",
        });
      }
    }
  }

  async delegation(username, data, id) {
    try {
      const cm = process.env.URL_CAMUNDA;
      const task = await axios.get(`${cm}/task/${id}`);
      const updatePayload = { ...task.data };

      updatePayload.owner = username;
      const responseSetOwner = await axios.put(
        `${cm}/task/${id}`,
        updatePayload
      );

      const projek = await axios.get(
        `${cm}/process-instance/${task.data.processInstanceId}`
      );

      const uuid = "";

      const cmnd = await upsertComment(
        uuid,
        username,
        task.data.name,
        projek.data.businessKey,
        data
      );


      if (responseSetOwner.status !== 204) {
        throw new Error("Failed to set owner in Camunda");
      }
      const variablesRes = await axios.get(`${cm}/task/${id}/variables`);
      const variables = variablesRes.data;
      const requireDocument = variables.requireDocument?.value;

      if (!requireDocument) {
        throw new Error("requireDocument tidak ditemukan");
      }

      // 2. Get current form variables
      const formVarsRes = await axios.get(`${cm}/task/${id}/form-variables`);
      const formVariables = formVarsRes.data;
      const requiredFormData = {};
      for (const docKey in formVariables) {
        if (docKey === requireDocument || docKey === requireDocument[docKey]) {
          requiredFormData[docKey] = formVariables[docKey];
        }
      }
      const variablesToSet = {};
      for (const key in requiredFormData) {
        variablesToSet[key] = {
          value: null, // Setting value to "test"
          type: requiredFormData[key].type, // Preserving original type
        };
      }

      // 4. Set task variables
      await axios.post(`${cm}/task/${id}/variables`, {
        modifications: variablesToSet,
      });

      const responsedelegate = await axios.post(`${cm}/task/${id}/delegate`, {
        userId: cmnd.username,
      });

      if (responsedelegate.status !== 204) {
        throw new Error("Failed to delegate task in Camunda");
      }

      return {
        code: 0,
        message: "success",
      };
    } catch (error) {
      console.error("Error in delegation:", error);

      if (error.response) {
        return {
          code: error.response.status,
          error: error.message || "Failed to process delegation",
          details: error.response.data,
          isCommentFailed: error.message.includes("comment"),
          isDelegateFailed: error.message.includes("delegate"),
        };
      } else {
        return {
          code: 500,
          error: error.message || "Failed to process delegation",
          details: error.stack,
          isCommentFailed: error.message.includes("comment"),
          isDelegateFailed: error.message.includes("delegate"),
        };
      }
    }
  }
  async Unassignee(taskid) {
    try {
      const cm = process.env.URL_CAMUNDA;
      const response = await axios.post(`${cm}/task/${taskid}/unclaim`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch tasks from Camunda. Status: 500",
        });
      }
    }
  }
  async overdue() {
    try {
      const camunda = process.env.URL_CAMUNDA;
      const currentDate = new Date();
      const dueDateAfter = new Date(
        currentDate.getTime() - 24 * 60 * 60 * 1000
      ); // 24 hours ago

      const response = await axios.get(`${camunda}/task`, {
        params: {
          dueDateAfter: dueDateAfter.toISOString(),
        },
        paramsSerializer: (params) => {
          return QueryString.stringify(params, { encode: false });
        },
      });
      const duedates = response.data
        .filter((task) => task.due !== null)
        .map((task) => task);
      return duedates;
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      throw error;
    }
  }
  async gettasklistinbox() {
    try {
      const response = await axios.get(`${process.env.CAMUNDA_URL}/task`);
      const tasks = response.data;

      const now = new Date();

      const notOverdueTasks = tasks.filter((task) => {
        if (!task.due) {
          return true;
        }
        const dueDate = new Date(task.due);
        return dueDate >= now;
      });

      return notOverdueTasks;
    } catch (error) {
      console.error("Error fetching or filtering tasks:", error);
      if (error.response) {
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        res.status(500).json({ error: "Failed to fetch or filter tasks" });
      }
    }
  }
  async bpmn(id) {
    if (!id) throw new Error("UUID is required");
    const df = await axios.get(
      `${process.env.URL_CAMUNDA}/process-definition/${id}/xml`
    );
    return df.data.bpmn20Xml;
  }

  async gettask(id) {
    const response = await axios.get(`${process.env.URL_CAMUNDA}/task/${id}`);
    const task = response.data;
    const processDefinitionParts = task.processDefinitionId
      ? task.processDefinitionId.split(":")
      : [];
    const processDefinitionName =
      processDefinitionParts.length > 0 ? processDefinitionParts[0] : null;
    const processNameParts = processDefinitionName.split("_");
    const designPart = processNameParts[2].split(":")[0];
    const processInstanceId = response.data.processInstanceId;

    if (!processInstanceId) {
      throw new Error("Process instance ID tidak ditemukan.");
    }

    const processResponse = await axios.get(
      `${process.env.URL_CAMUNDA}/process-instance/${processInstanceId}`
    );
    const businessKey = processResponse.data.businessKey;
    const bpm = await this.bpmn(response.data.processDefinitionId);
    let transformedComments = [];
    try {
      const comment = await getcommen(businessKey);
      const filteredComments = comment?.filter(
        (item) => item.taskname === response.data.name
      );

      transformedComments = filteredComments
        ? filteredComments.map((item) => ({
            user: item.username,
            description: item.deskripsi,
          }))
        : [];
    } catch (error) {
      throw error;
    }

    const form = await axios.get(
      `${process.env.URL_CAMUNDA}/task/${id}/form-variables`
    );
    const varb = await axios.get(
      `${process.env.URL_CAMUNDA}/task/${id}/variables`
    );
    const formVariables = form.data;
    const extractedVariables = {};

    for (const [key, variable] of Object.entries(varb.data)) {
      if (key === "requireDocument") {
        continue;
      }
      extractedVariables[key] = variable;
    }

    // Process form variables first
    for (const [key, variable] of Object.entries(formVariables)) {
      if (key === "requireDocument") {
        continue;
      }
      if (extractedVariables[key] === key) {
        continue;
      }
      extractedVariables[key] = variable;

      if (variable.type === "Json" && typeof variable.value === "string") {
        extractedVariables[key] = JSON.parse(variable.value);
      }
    }

    // Now add task variables that aren't in the form variables at the end
    for (const [key, variable] of Object.entries(varb.data)) {
      if (
        !extractedVariables.hasOwnProperty(key) &&
        key !== "requireDocument"
      ) {
        extractedVariables[key] = variable;

        if (variable.type === "Json" && typeof variable.value === "string") {
          try {
            extractedVariables[key] = JSON.parse(variable.value);
          } catch (e) {
            throw e;
          }
        }
      }
    }

    const data = {
      id: response.data.id,
      task_name: response.data.name,
      assignee: response.data.assignee,
      created: response.data.owner,
      due_date: response.data.due,
      delegition: response.data.delegationState,
      bpm,
      active: response.data.taskDefinitionKey,
      DefinitionId: response.data.processDefinitionId,
      InstanceId: response.data.processInstanceId,
      priority: response.data.priority,
      description: response.data.description,
      comment: transformedComments, // Akan berupa array kosong jika tidak ada komentar
      VariablesTask: extractedVariables,
      tahap: designPart,
    };
    return data;
  }
}

module.exports = new TaskService();
