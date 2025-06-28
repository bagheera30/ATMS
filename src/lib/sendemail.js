const nodemailer = require("nodemailer");

// Buat transport sekali saja di level module
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true untuk 465, false untuk port lain
  auth: {
    user: process.env.EMAIL_VERIF,
    pass: process.env.PASSWORD_EMAIL,
  },
});

const sendEmail = async (email, subject, template) => {
  try {
    // Validasi input
    if (!email || !subject || !template) {
      throw new Error("Missing required email parameters");
    }

    const mailOptions = {
      from: process.env.EMAIL_VERIF,
      to: email,
      subject: subject,
      html: template,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // atau return false jika ingin menangani error secara silent
  }
};

module.exports = sendEmail;
