const responseHandler = (res, statusCode, success, data = null, message = null) => {
    const response = {
        success,
        ...(message && { message }),
        ...(data && { data })
    };
    res.status(statusCode).json(response);
};
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return responseHandler(res, statusCode, true, data, message);
};

const sendError = (res, message = 'Error', statusCode = 400) => {
    return responseHandler(res, statusCode, false, null, message);
};

module.exports = {
    responseHandler,
    sendSuccess,
    sendError
};
