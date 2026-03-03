const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Career Hub API Running 🚀");
});

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email required" });

  const otp = generateOTP();
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

  try {
    await transporter.sendMail({
      from: `"Career Hub" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ message: "No OTP found" });

  if (Date.now() > record.expires)
    return res.status(400).json({ message: "OTP expired" });

  if (otp !== record.otp)
    return res.status(400).json({ message: "Invalid OTP" });

  otpStore.delete(email);
  res.json({ message: "Email verified successfully ✅" });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});