/**
 * Authentication Input Validation Helpers
 */

const validateEmail = (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateOTP = (otp) => {
    return otp && otp.length === 6 && /^\d+$/.test(otp);
};

module.exports = {
    validateEmail,
    validatePassword,
    validateOTP
};
