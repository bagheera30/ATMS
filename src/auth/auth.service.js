const authRepository = require("./auth.repository");
const bcrypt = require("bcrypt");
const { randomPassword } = require("../lib/temppassword");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { updateUser } = require("../user/user.repository");
const sendEmail = require("../lib/sendemail");

class authService {
  async createUser(data) {
    const namaLengkap = data.namaLengkap;
    const email = data.email;
    const password = data.password;
    const dateOfBirth = data.dateOfBirth;
    const jabatan = data.jabatan;

    if (!namaLengkap || !email || !password || !dateOfBirth || !jabatan) {
      throw new Error("please complete the form1");
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        ...data,
        password: hashedPassword,
      };

      // const otp = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
      const otp = 11111;

      const otpExpires = Math.floor(Date.now() / 1000) + 5 * 60;
      console.log({ user });
      const newUser = await authRepository.createUser(
        { user },
        otp,
        otpExpires
      );
      console.log(newUser);
      if (!newUser.status) {
        return {
          code: 1,
          status: false,
          message: "email or username already exist",
        };
      }
      const temp = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
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
  </div>`;
      const sendemail = await sendEmail(email, "Kode OTP Verifikasi", temp);
      if (sendemail == false) {
        return {
          code: 1,
          status: false,
          message: "valid sendemail",
        };
      }
      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }
  async forgotPassword(data) {
    try {
      const email = await authRepository.validasiEmail(data.email);
      if (!email) {
        return {
          code: 1,
          status: false,
          message: "email not found",
        };
      }
      const pw = randomPassword();
      const hashedPassword = await bcrypt.hash(pw, 10);
      const d = {
        password: hashedPassword,
      };
      const user = await updateUser(email.id, d, "");

      const temp = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <img src="https://img.freepik.com/free-psd/phone-icon-design_23-2151311652.jpg?t=st=1740712456~exp=1740716056~hmac=edbd775bf2f8b086629ddbb8440face843343bf69929cb8a4137e9c3aa1c2848&w=900" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
    <h2 style="color: #4CAF50; text-align: center;">Password Sementara Anda</h2>
    <p style="text-align: center;">Berikut adalah password sementara untuk akun Anda. Harap segera ganti password setelah login untuk keamanan akun Anda.</p>
    <div style="text-align: center; margin: 20px 0;">
      <h1 style="background-color: #4CAF50; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px;">
        ${pw}
      </h1>
    </div>
    <p style="text-align: center;"><strong>Instruksi Keamanan:</strong></p>
    <ul style="margin: 0 auto; max-width: 400px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Jangan bagikan password ini kepada siapapun</li>
      <li style="margin-bottom: 8px;">Ganti password segera setelah login</li>
      <li style="margin-bottom: 8px;">Gunakan password yang unik dan kuat</li>
    </ul>
    <p style="text-align: center; font-size: 12px; color: #777;">Jika Anda tidak meminta password sementara ini, segera hubungi tim dukungan kami.</p>
    <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
      <p>&copy; 2023 YourCompany. All rights reserved.</p>
      <p><a href="https://yourdomain.com/privacy" style="color: #4CAF50; text-decoration: none;">Kebijakan Privasi</a> | <a href="https://yourdomain.com/contact" style="color: #4CAF50; text-decoration: none;">Hubungi Kami</a></p>
    </footer>
  </div>`;
      if (!user) {
        return {
          code: 2,
          status: false,
          message: "forgot password user",
        };
      }
      const sendemail = await sendEmail(email.email, "Reset Password", temp);
      if (sendemail == false) {
        return {
          code: 1,
          status: false,
          message: "valid sendemail",
        };
      }
      return {
        code: 0,
        status: true,
        message: "sucess",
      };
    } catch (error) {
      return {
        code: 2,
        status: false,
        message: error.message,
      };
    }
  }
  async resendOtp(email) {
    try {
      const otp = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
      const otpExpires = Math.floor(Date.now() / 1000) + 5 * 60;
      const result = await authRepository.resendotp(email, otp, otpExpires);
      console.log("service", result);
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
        from: process.env.EMAIL_VERIF, // Email pengirim
        to: email,
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

      await nm.sendMail(mailOptions);
      console.log("Email OTP terkirim");
      return result;
    } catch (error) {
      throw new Error(`Verifikasi OTP gagal: ${error.message}`);
    }
  }
  async VerifOtp(otp) {
    if (!otp) {
      throw new Error("Harap masukkan OTP");
    }

    try {
      const intotp = parseInt(otp);
      if (isNaN(intotp)) {
        throw new Error("OTP harus berupa angka");
      }
      const time = Math.floor(Date.now() / 1000);

      const verificationResult = await authRepository.findToken(intotp, time);
      console.log(verificationResult);
      if (verificationResult.status == false) {
        return {
          status: false,
          message: verificationResult.message,
        };
      }
      return {
        success: true,
        message: verificationResult.status,
      };
    } catch (error) {
      throw new Error(`Verifikasi OTP gagal: ${error.message}`);
    }
  }
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Please complete the form");
    }
    try {
      // Panggil repository untuk mendapatkan data pengguna dari Neo4j
      const authResult = await authRepository.authentication(email);

      // Cek apakah pengguna ditemukan atau statusnya tidak valid
      if (!authResult.status) {
        const message = authResult.message;
        return message;
      }

      const rolename = authResult.roles.map((node) => node.properties.RoleName);
      const role = rolename.toString();
      // Ambil data pengguna dari hasil query
      const user = authResult.user.properties;

      // Verifikasi kata sandi menggunakan bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          code: 1,
          status: false,
          message: "Incorrect password",
        };
      }
      // Jika autentikasi berhasil, buat token JWT
      const token = jwt.sign(
        { userId: user.uuid, username: user.username, roles: role }, // Payload token
        process.env.JWT_SECRET || "default_secret", // Use environment variable or default secret
        { expiresIn: "1h" } // Token berlaku selama 1 jam
      );

      return {
        code: 0,
        status: true,
        message: "Authentication successful",
        token,
      };
    } catch (error) {
      console.error("Error during authentication:", error);
      return {
        code: 1,
        status: false,
        message: "An error occurred during authentication",
      };
    }
  }
}

module.exports = new authService();
