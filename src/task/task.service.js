const { param } = require("../projek/projek.controller");
const { default: axios } = require("axios");
const { upsert, upsertComment, getcommen } = require("./task.repository");
const QueryString = require("qs");

class TaskService {
  async getalltask() {
    try {
      const urlcamund = process.env.URL_CAMUNDA;
      const response = await axios.get(`${urlcamund}/task`);
      const tasks = response.data;

      // Filter hanya field yang dibutuhkan
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
        // Jika error berasal dari response server
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        // Jika error berasal dari komunikasi dengan server
        res.status(500).json({
          error: "Failed to fetch tasks from Camunda. Status: 500",
        });
      }
    }
  }

  async getasbyinbox(username) {
    try {
      console.log(username);
      const urlcamund = process.env.URL_CAMUNDA;
      const response = await axios.get(`${urlcamund}/task`, {
        params: {
          assignee: username,
        },
      });
      const tasks = response.data;
      console.log(tasks);

      // Filter hanya field yang dibutuhkan
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
        // Jika error berasal dari response server
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        // Jika error berasal dari komunikasi dengan server
        res.status(500).json({
          error: "Failed to fetch tasks from Camunda. Status: 500",
        });
      }
    }
  }

  async assignee(username, taskid) {
    try {
      const cm = process.env.URL_CAMUNDA;
      console.log(username, taskid);
      const response = await axios.post(`${cm}/task/${taskid}/claim`, {
        userId: username,
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        // Jika error berasal dari response server
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        // Jika error berasal dari komunikasi dengan server
        res.status(500).json({
          error: "Failed to fetch tasks from Camunda. Status: 500",
        });
      }
    }
  }

  async delegation(username, data, id) {
    try {
      const cm = process.env.URL_CAMUNDA;
      const task = await axios.get(`${cm}/task/${id}`); // Ditambahkan await jika gettask async

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
      const taskid = id;

      // Post comment ke Camunda dengan pengecekan response
      const responseCamundaComment = await axios.post(
        `${cm}/task/${taskid}/comment/create`,
        {
          userId: cmnd.username, // Diperbaiki dari usernamee ke username
          message: data.deskripsi,
        }
      );

      // Cek apakah comment berhasil dibuat
      if (
        !responseCamundaComment.data ||
        responseCamundaComment.status !== 200
      ) {
        throw new Error("Failed to create comment in Camunda");
      }

      // Delegate task dengan pengecekan response
      const responsedelegate = await axios.post(
        `${cm}/task/${taskid}/delegate`,
        {
          userId: cmnd.username,
        }
      );

      // Cek apakah delegasi berhasil
      if (responsedelegate.status !== 204) {
        // Biasanya endpoint delegate mengembalikan 204 No Content
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
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error.response) {
        // Jika error berasal dari response server
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        // Jika error berasal dari komunikasi dengan server
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

      // Set the overdue threshold (e.g., tasks due before now are overdue)
      const dueDateAfter = new Date(
        currentDate.getTime() - 24 * 60 * 60 * 1000
      ); // 24 hours ago

      const response = await axios.get(`${camunda}/task`, {
        params: {
          dueDateBefore: currentDate.toISOString(),
          dueDateAfter: dueDateAfter.toISOString(),
          // Additional useful filters:
          // assigned: true/false,
          // taskDefinitionKey: 'your_task_key',
          // processInstanceId: 'your_process_id'
        },
        paramsSerializer: (params) => {
          return QueryString.stringify(params, { encode: false });
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      throw error; // Or handle it appropriately for your use case
    }
  }
  async gettasklistinbox() {
    try {
      // Fetch all tasks from Camunda menggunakan Axios
      const response = await axios.get(`${process.env.CAMUNDA_URL}/task`);
      console.log("test", response.data);
      const tasks = response.data;

      // Current time for filtering
      const now = new Date();

      // Filter tasks that are not overdue: due date is either null or dueDate >= now
      const notOverdueTasks = tasks.filter((task) => {
        console.log(tasks.due);
        if (!task.due) {
          // no due date, consider not overdue
          return true;
        }
        const dueDate = new Date(task.due);
        return dueDate >= now;
      });

      return notOverdueTasks;
    } catch (error) {
      console.error("Error fetching or filtering tasks:", error);
      if (error.response) {
        // Jika error berasal dari response server
        res.status(error.response.status).json({
          error: `Failed to fetch tasks from Camunda. Status: ${error.response.status}`,
        });
      } else {
        // Jika error lainnya (network error, dll)
        res.status(500).json({ error: "Failed to fetch or filter tasks" });
      }
    }
  }
  async gettask(id) {
    console.log("test");
    const response = await axios.get(`${process.env.URL_CAMUNDA}/task/${id}`);

    let transformedComments = []; // Default empty array
    try {
      const comment = await getcommen(response.data.name);
      transformedComments = comment
        ? comment.map((item) => ({
            user: item.user[0], // Mengambil elemen pertama dari array user
            description: item.deskripsi[0], // Mengambil elemen pertama dari array deskripsi
          }))
        : [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Jika terjadi error, transformedComments tetap empty array
    }

    const form = await axios.get(
      `${process.env.URL_CAMUNDA}/task/${id}/form-variables`
    );

    const data = {
      id: response.data.id,
      task_name: response.data.name,
      assignee: response.data.assignee,
      created: response.data.owner,
      due_date: response.data.due,
      DefinitionId: response.data.processDefinitionId,
      InstanceId: response.data.processInstanceId,
      priority: response.data.priority,
      description: response.data.description,
      comment: transformedComments, // Akan berupa array kosong jika tidak ada komentar
      VariablesTask: form.data,
    };
    return data;
  }
}

module.exports = new TaskService();
