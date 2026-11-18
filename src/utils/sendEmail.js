const nodemailer = require('nodemailer');

// Send verification email using Nodemailer.
// If email credentials are not provided in .env, we log the link to the console
// so you can test registration and verification locally without setting up Gmail credentials.
const sendVerificationEmail = async ({ email, token }) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5001'}/api/auth/verify/${token}`;

  // Fallback for local development
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n--- [EMAIL SERVICE (LOCAL DEV)] ---');
    console.log(`Recipient: ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('-----------------------------------\n');
    return;
  }

  // Create reusable transporter object using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Uses a 16-character Gmail App Password
    },
  });

  const mailOptions = {
    from: `"Auth API" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Please verify your email address',
    html: `
      <h2>Welcome to Auth API!</h2>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not create this account, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
