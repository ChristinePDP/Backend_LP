// 1. Change require to import
import nodemailer from 'nodemailer';
import 'dotenv/config.js'; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email Server Error:", error);
  } else {
    console.log("✅ Email Server is ready to take our messages");
  }
});

// 2. Change module.exports to export default
export default transporter;