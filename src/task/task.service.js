const { param } = require("../projek/projek.controller");
const { default: axios } = require("axios");
class TaskService {
  async getalltask() {
    try {
      const urlcamund = process.env.URL_CAMUNDA;
      const response = await axios.get(`${urlcamund}/task`);
      const tasks = response.data;

      // Filter hanya field yang dibutuhkan
      const filteredTasks = tasks.map((task) => ({
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
  async overdue(){
    try {
      const camunda = process.env.CAMUNDA_URL;
      const response= await axios.get(`${camunda}/task`);
      
    } catch (error) {
      
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
    const response = await axios.get(`${process.env.CAMUNDA_URL}/task/${id}`);
    return response.data;
  }
}

module.exports = new TaskService();
