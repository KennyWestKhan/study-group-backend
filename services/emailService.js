const nodemailer = require('nodemailer');

let transporter;

// Initialize once
const initTransporter = async () => {
  if (!transporter) {
    try {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('Ethereal email transporter initialized');
    } catch (error) {
      console.error('Failed to create email transporter', error);
    }
  }
};

// Initialize eagerly so it's ready
initTransporter();

// Set up simple transporter using Ethereal (fake SMTP for testing/demo)
// To test with real emails, update process.env variables and service.
const sendWelcomeEmail = async (email, name) => {
  try {
    if (!transporter) {
      await initTransporter();
    }
    
    let info = await transporter.sendMail({
      from: '"StudyMatch Team" <noreply@studymatch.app>', // sender address
      to: email, // list of receivers
      subject: "Welcome to StudyMatch! 📚", // Subject line
      text: `Hello ${name}, welcome to StudyMatch! We're excited to help you find the best study groups.`, // plain text body
      html: `<b>Hello ${name}, welcome to StudyMatch!</b><br>We're excited to help you find the best study groups.`, // html body
    });

    console.log("Welcome Email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Email error:", error);
  }
};

const sendPasswordResetEmail = async (email, name, token) => {
  try {
    if (!transporter) {
      await initTransporter();
    }
    
    let info = await transporter.sendMail({
      from: '"StudyMatch Team" <noreply@studymatch.app>',
      to: email,
      subject: "Password Reset Request 🔒",
      text: `Hello ${name}, you requested a password reset. Your token is: ${token}`,
      html: `<b>Hello ${name},</b><br>Click <a href="http://localhost:5173/reset-password?token=${token}">here</a> to reset your password.`,
    });

    console.log("Reset Email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Email error:", error);
  }
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
