const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;

    // Gmail support (most common for dev/production)
    if (process.env.EMAIL_SERVICE === 'gmail') {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD  // Use Gmail App Password (not your Gmail password)
            }
        });
    } else {
        // Mailtrap / custom SMTP fallback
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
            port: parseInt(process.env.SMTP_PORT) || 2525,
            auth: {
                user: process.env.SMTP_EMAIL || '',
                pass: process.env.SMTP_PASSWORD || ''
            }
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'ThinkCode'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html  // HTML email body (takes priority over text in most clients)
    };

    const info = await transporter.sendMail(message);
    console.log(`📧 Email sent to ${options.email} — Message ID: ${info.messageId}`);
    return info;
};

module.exports = sendEmail;

