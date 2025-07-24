const authRepository = require("./auth.repository");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { updateUser } = require("../user/user.repository");
const sendEmail = require("../lib/sendemail");
const { randomPassword } = require("../lib/temppassword");

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

      const otp = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;

      const otpExpires = Math.floor(Date.now() / 1000) + 5 * 60;
      const newUser = await authRepository.createUser(
        { user },
        otp,
        otpExpires
      );
      if (!newUser.status) {
        return {
          code: 1,
          status: false,
          message: "email or username already exist",
        };
      }
      const temp = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <img src="https://www.digiserve.co.id/microsoft/images/s.png" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
    <h2 style="color: #4CAF50; text-align: center;">Welcome!</h2>
    <p style="text-align: center;">Thank you for registering with our service. To complete your registration, please enter the following OTP code:</p>
    <div style="text-align: center; margin: 20px 0;">
      <h1 style="background-color: #4CAF50; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px;">
        ${otp} <!-- OTP will be inserted here -->
      </h1>
    </div>
    <p style="text-align: center; font-size: 12px; color: #777;">This OTP code is valid for 5 minutes only.</p>
    <p style="text-align: center; font-size: 12px; color: #777;">If you didn't request this OTP code, please ignore this email.</p>
    <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
      <p>©2025. PT Sigma Cipta Caraka - Telkomsigma. All Righs Reserved.</p>
    </footer>
</div>`;
      const sendemail = await sendEmail(email, "Verification OTP Code", temp);
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
            <img src="https://www.digiserve.co.id/microsoft/images/s.png" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">Your Temporary Password</h2>
            <p style="text-align: center;">Below is your temporary account password. Please change it immediately after logging in to secure your account.</p>
            <div style="text-align: center; margin: 20px 0;">
              <h1 style="background-color: #4CAF50; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px;">
                ${pw}
              </h1>
            </div>
            <p style="text-align: center;"><strong>Security Instructions:</strong></p>
            <ul style="margin: 0 auto; max-width: 400px; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Do not share this password with anyone</li>
              <li style="margin-bottom: 8px;">Change the password immediately after logging in</li>
              <li style="margin-bottom: 8px;">Use a unique and strong password</li>
            </ul>
            <p style="text-align: center; font-size: 12px; color: #777;">If you didn't request this temporary password, please contact our support team immediately.</p>
             <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
                <p>©2025. PT Sigma Cipta Caraka - Telkomsigma. All Righs Reserved.</p>
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
        subject: "Verification OTP Code",
        html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <img src="https://www.digiserve.co.id/microsoft/images/s.png" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
            <h2 style="color: #4CAF50; text-align: center;">Reset Your OTP</h2>
            <p style="text-align: center;">You have requested a new One-Time Password (OTP). Use the following code to verify your identity:</p>
            <div style="text-align: center; margin: 20px 0;">
              <h1 style="background-color: #4CAF50; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 24px;">
                ${otp} 
              </h1>
            </div>
            <p style="text-align: center; font-size: 12px; color: #777;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
            <p style="text-align: center; font-size: 12px; color: #777;">If you didn't request this OTP reset, secure your account immediately.</p>
            <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
                <p>©2025. PT Sigma Cipta Caraka - Telkomsigma. All Righs Reserved.</p>
              </footer>
          </div>`,
      };

      await nm.sendMail(mailOptions);
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
      console.log(time);
      console.log(time);

      const verificationResult = await authRepository.findToken(intotp, time);
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
      const authResult = await authRepository.authentication(email);

      if (!authResult.status) {
        const message = authResult.message;
        return message;
      }

      const user = authResult.user.properties;

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          code: 1,
          status: false,
          message: "Incorrect password",
        };
      }
      const token = jwt.sign(
        { userId: user.uuid, username: user.username },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "1d" }
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
