import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `Zappy <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your Zappy OTP Verification Code',
    text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
  });
};
