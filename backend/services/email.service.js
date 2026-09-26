const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // If Gmail Service or custom SMTP credentials are provided in env, use them
    if (process.env.SMTP_SERVICE === 'gmail' && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"StockSense Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[REAL GMAIL SENT to ${to}] MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, isReal: true };
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"StockSense Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[SMTP EMAIL SENT to ${to}] MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, isReal: true };
    }

    // Default: Generate Ethereal test inbox for instant preview without requiring external credentials
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"StockSense Security" <security@stocksense.io>',
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL DISPATCHED to ${to}]`);
    console.log(`[EMAIL PREVIEW URL]: ${previewUrl}`);

    return {
      success: true,
      previewUrl,
    };
  } catch (error) {
    console.error('[EMAIL ERROR]:', error);
    // Don't crash process if mail server fails
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
