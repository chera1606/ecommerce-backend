/**
 * @desc Higher-order function to handle async errors in Express routes
 * Eliminates the need for repetitive try/catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
