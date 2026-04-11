

const sendEmail = async (options) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'E-Shop Support',
                email: process.env.FROM_EMAIL,
            },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message,
            htmlContent: options.html,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || `Brevo API error: ${response.status}`);
    }
};

module.exports = sendEmail;

