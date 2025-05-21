const { param } = require("../projek/projek.controller");

class TaskService {
  async gettasklist() {
    const axios = require("axios"); // Jika menggunakan CommonJS
    // atau
    // import axios from 'axios'; // Jika menggunakan ES modules

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
}

module.exports = new TaskService();
