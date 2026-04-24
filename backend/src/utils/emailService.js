const nodemailer = require('nodemailer');

const hasSmtpConfig = () =>
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.FROM_EMAIL;

const buildSmtpTransport = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

const sendWithSmtp = async (options) => {
    const transporter = buildSmtpTransport();
    await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    });
};

const sendWithBrevo = async (options) => {
    if (!process.env.BREVO_API_KEY || !process.env.FROM_EMAIL) {
        throw new Error('Email service is not configured.');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'E-Shop Support',
                email: process.env.FROM_EMAIL
            },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message,
            htmlContent: options.html
        })
    });

    if (!response.ok) {
        let errorMessage = `Brevo API error: ${response.status}`;

        try {
            const errorBody = await response.json();
            errorMessage = errorBody?.message || errorMessage;
        } catch {
            // Keep the generic error message if Brevo returns a non-JSON response.
        }

        throw new Error(errorMessage);
    }
};

const sendEmail = async (options) => {
    if (hasSmtpConfig()) {
        return sendWithSmtp(options);
    }

    return sendWithBrevo(options);
};

module.exports = sendEmail;
