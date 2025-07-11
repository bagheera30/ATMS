const { param } = require("../projek/projek.controller");
const { default: axios } = require("axios");
const { upsert, upsertComment, getcommen } = require("./task.repository");
const QueryString = require("qs");
const { getDetailDefinition } = require("../projek/projek.service");
const { findUserAllByUsername } = require("../user/user.repository");

class TaskService {
  async getalltask(businessKey) {
    if (!businessKey) {
      throw new Error("please complete the querry");
    }
    try {
      const urlCamunda = process.env.URL_CAMUNDA;
      const response = await axios.get(`${urlCamunda}/task`, {
        params: {
          processInstanceBusinessKey: businessKey,
        },
      });
      const tasks = response.data;

      const filteredTasks = tasks.map((task) => ({
        id: task.id,
        name: task.name,
        owner: task.owner,
        assignee: task.assignee,
        created: task.created,
        followUp: task.followUp,
        due_date: task.due,
        delegation: task.delegationState,
      }));

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

      const responseAssignee = await axios.get(`${urlcamund}/task`, {
        params: {
          assignee: username,
        },
      });
      const lw = username.toLowerCase();

      const ow = await findUserAllByUsername(lw);

      const responseOwner = await axios.get(`${urlcamund}/task`, {
        params: {
          owner: ow.fullName,
        },
      });

      const combinedTasks = [...responseAssignee.data, ...responseOwner.data];
      const uniqueTasks = Array.from(
        new Map(combinedTasks.map((task) => [task.id, task])).values()
      );

      const filteredTasks = uniqueTasks.map((task) => ({
        id: task.id,
        active: task.taskDefinitionKey,
        name: task.name,
        owner: task.owner,
        assignee: task.assignee,
        created: task.created,
        followUp: task.followUp,
        due_date: task.due,
        delegation: task.delegationState,
      }));

      return filteredTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error.message);
      throw error;
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
      console.log(task.data);
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

    

      console.log(responseSetOwner);

      if (responseSetOwner.status !== 204) {
        throw new Error("Failed to set owner in Camunda");
      }
      const variablesRes = await axios.get(`${cm}/task/${id}/variables`);
      const variables = variablesRes.data;
      const requireDocument = variables.requireDocument?.value;

      if (!requireDocument) {
        console.log("requireDocument tidak ditemukan");
        return;
      }

      // 2. Get current form variables
      const formVarsRes = await axios.get(`${cm}/task/${id}/form-variables`);
      const formVariables = formVarsRes.data;
      const requiredFormData = {};
      for (const docKey in formVariables) {
        if (docKey === requireDocument || docKey === requireDocument[docKey]) {
          requiredFormData[docKey] = formVariables[docKey];
          console.log("Matched form variable:", docKey, formVariables[docKey]);
        }
      }
      console.log("Required form data:", requiredFormData);
      // 3. Prepare variables to set (with test values)
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
  async gettask(id) {
    const response = await axios.get(`${process.env.URL_CAMUNDA}/task/${id}`);
    console.log(response.data.name);
    const processInstanceId = response.data.processInstanceId;

    if (!processInstanceId) {
      throw new Error("Process instance ID tidak ditemukan.");
    }

    const processResponse = await axios.get(
      `${process.env.URL_CAMUNDA}/process-instance/${processInstanceId}`
    );
    const businessKey = processResponse.data.businessKey;
    const bpm = await getDetailDefinition(response.data.processDefinitionId);
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
      console.error("Error fetching comments:", error);
    }

    const form = await axios.get(
      `${process.env.URL_CAMUNDA}/task/${id}/form-variables`
    );
    const formVariables = form.data;
    const extractedVariables = {};

    for (const [key, variable] of Object.entries(formVariables)) {
      if (key === "requireDocument") {
        continue;
      }
      extractedVariables[key] = variable;

      if (variable.type === "Json" && typeof variable.value === "string") {
        extractedVariables[key] = JSON.parse(variable.value);
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
    };
    return data;
  }
}

module.exports = new TaskService();
