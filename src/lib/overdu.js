import { Client } from "camunda-external-task-client-js";

const camunda_url = process.env.CAMUNDA_URL;
const client = new Client({ baseUrl: camunda_url });

const topic = process.argv[2] || "cond_email_reminder_topic";
console.log(`Topic listener is Up...[${topic}]`);

const topicSubscription = client.subscribe({
  topic,
  async function({ task, taskService }) {
    // request the current usertask
    var response = await fetch(
      `${camunda_url}/task?processInstanceId=${task.processInstanceId}`
    );
    var data = await response.json();

    // ADD LOGIC TO SEND EMAIL HERE
    // ADD LOGIC TO COMMUNICATE WITH OTHER API (IDM, INVENTORY, OR OTHER GATEWAY)

    if (data) {
      console.log("Current taskname: ", data[0].name);
      console.log("task detail: ", data[0]);
    }

    await taskService.complete(task);
    console.log(
      `Task External ${topic}-${task.processInstanceId}...set Completed`
    );
  },
});

module.exports = topicSubscription;
