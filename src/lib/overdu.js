const { Client } = require("camunda-external-task-client-js");
const nodemailer = require("nodemailer");
require("dotenv").config();

const overdue = (topik) => {
  const camunda_url = process.env.CAMUNDA_URL;
  console.log(camunda_url);
  const topic = topik || "send_email_reminder_topic";

  // Konfigurasi client dengan polling interval 5 detik (5000 ms)
  const client = new Client({
    baseUrl: process.env.CAMUNDA_URL,
    asyncResponseTimeout: 5000, // Sesuaikan dengan timeout Vercel
  });
  client.subscribe(topic, async function ({ task, taskService }) {
    try {
      console.log(`Processing task ${task.id}...`);

      const response = await fetch(
        `${camunda_url}/task?processInstanceId=${task.processInstanceId}`
      );
      const data = await response.json();

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
        to: "rizkialfian30103@gmail.com",
        subject: `[Overdue] ${data[0]?.name || "Notifikasi Camunda"}`,
        text: `Kepada Yth.,
    
Task dengan detail berikut telah melewati batas waktu yang ditentukan:
- Nama Task: ${data[0]?.name || "Tidak tersedia"}
- ID Task: ${data[0]?.id || "Tidak tersedia"}

Harap segera ditindaklanjuti.

Hormat kami,
Sistem Notifikasi`,
      };

      await nm.sendMail(mailOptions);

      if (data.length > 0) {
        console.log("Current task name:", data[0].name);
        console.log("Task detail:", data[0]);
      }

      await taskService.complete(task);
      console.log(`Task ${task.id} completed successfully`);
      setTimeout(() => {
        res.status(200).json({ status: "processed" });
      }, 9000);
    } catch (err) {
      console.error("Error processing task:", err);
      // Anda mungkin ingin menambahkan handling error lebih lanjut di sini
    }
  });
};

// Tambahkan handler error untuk client

console.log("Worker started and will poll every 5 seconds");

module.exports = overdue;
