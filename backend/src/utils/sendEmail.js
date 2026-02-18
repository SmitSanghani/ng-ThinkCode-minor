const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    // For production, use a real service like SendGrid, SES, or Postmark
    // For dev, likely using Mailtrap or Ethereal
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL || 'user',
            pass: process.env.SMTP_PASSWORD || 'pass'
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Auth System'} <${process.env.FROM_EMAIL || 'noreply@auth.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Optional HTML body
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
