/**
 * Email Templates for E-Shop
 */

const passwordResetTemplate = (otp, firstName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 10px;
                background-color: #ffffff;
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #c0392b;
                margin: 0;
            }
            .content {
                line-height: 1.6;
                color: #4a4a4a;
            }
            .otp-box {
                background-color: #fff5f5;
                border: 2px dashed #e74c3c;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 5px;
                color: #c0392b;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 12px;
                color: #999999;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello ${firstName},</p>
                <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, please secure your account.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 E-Shop Inc. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    passwordResetTemplate
};
