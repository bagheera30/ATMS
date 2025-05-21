import { Client } from "camunda-external-task-client-js";
import { body } from "express-validator";
const nodemailer = require("nodemailer");
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
    const nm = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_VERIF,
        pass: process.env.PASSWORD_EMAIL,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_VERIF,
      to: email,
      subject: data[0].name,
      body: data[0].description,
    };
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
