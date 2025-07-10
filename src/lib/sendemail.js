const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_VERIF,
    pass: process.env.PASSWORD_EMAIL,
  },
});

const sendEmail = async (email, subject, template) => {
  try {
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
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
