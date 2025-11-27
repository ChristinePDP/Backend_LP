const nodemailer = require('nodemailer');
require('dotenv').config(); // Siguraduhin na naka-install ang dotenv

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Galing sa .env
    pass: process.env.EMAIL_PASS, // Galing sa .env (App Password)
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email Server Error:", error);
  } else {
    console.log("Email Server is ready to take our messages");
  }
});

module.exports = transporter;