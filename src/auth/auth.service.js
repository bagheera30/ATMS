const authRepository = require("./auth.repository");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
class authService {
  async createUser(data) {
    const username = data.username;
    const email = data.email;
    const password = data.password;
    const dateOfBirth = data.dateOfBirth;
    const phoneNumber = data.phoneNumber;
    if (!username || !email || !password || !dateOfBirth || !phoneNumber) {
      throw new Error("please complete the form1");
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        ...data,
        password: hashedPassword,
      };

      const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
      const newUser = await authRepository.createUser({ user }, otp);
      const nm = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_VERIF,
          pass: process.env.PASSWORD_EMAIL,
        },
      });
      const mailOptions = {
        from: process.env.EMAIL_VERIF, // Email pengirim
        to: email, // Email penerima
        subject: "Kode OTP Verifikasi", // Subjek email
        html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <img src="https://img.freepik.com/free-psd/phone-icon-design_23-2151311652.jpg?t=st=1740712456~exp=1740716056~hmac=edbd775bf2f8b086629ddbb8440face843343bf69929cb8a4137e9c3aa1c2848&w=900" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
    <h2 style="color: #4CAF50; text-align: center;">Selamat Datang!</h2>
    <p style="text-align: center;">Terima kasih telah mendaftar di layanan kami. Untuk menyelesaikan proses registrasi, silakan masukkan kode OTP berikut:</p>
    <div style="text-align: center; margin: 20px 0;">
      <h1 style="background-color: #4CAF50; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px;">
        ${otp} <!-- OTP akan disisipkan di sini -->
      </h1>
    </div>
    <p style="text-align: center; font-size: 12px; color: #777;">Kode OTP ini hanya berlaku selama 5 menit.</p>
    <p style="text-align: center; font-size: 12px; color: #777;">Jika Anda tidak merasa meminta kode OTP ini, abaikan email ini.</p>
    <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
      <p>&copy; 2023 YourCompany. All rights reserved.</p>
      <p><a href="https://yourdomain.com/privacy" style="color: #4CAF50; text-decoration: none;">Kebijakan Privasi</a> | <a href="https://yourdomain.com/contact" style="color: #4CAF50; text-decoration: none;">Hubungi Kami</a></p>
    </footer>
  </div>`,
      };

      nm.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error("Gagal mengirim email OTP:", error);
        } else {
          console.log("Email OTP terkirim:", info.response);
        }
      });
      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async VerifOtp(otp) {
    if (!otp) {
      throw new Error("Please input otp");
    }
    console.log(otp);
    try {
      const votp = otp;
      const vrfotp = await authRepository.findToken(votp);
      return vrfotp;
    } catch (error) {
      throw new Error(`cannot OTP: ${error.message}`);
    }
  }
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Please complete the form");
    }
    try {
      const user = await authRepository.authtetication(email, password);
    } catch (error) {
      throw new Error(`cannot user: ${error.message}`);
    }
  }
}

module.exports = new authService();
