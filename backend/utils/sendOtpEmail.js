import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `Zappy <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your Zappy OTP Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2>Zappy email verification</h2>
        <p>Your one-time password is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
};