const { responseHandler } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    let { statusCode, message } = error;

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        statusCode = 400;
        error = new ApiError(statusCode, message, false, err.stack);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map(val => val.message).join(', ');
        statusCode = 400;
        error = new ApiError(statusCode, message, false, err.stack);
    }

    responseHandler(res, statusCode, false, null, message);
};

module.exports = errorHandler;
