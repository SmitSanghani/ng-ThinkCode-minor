const { responseHandler } = require('../utils/responseHandler');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return responseHandler(
                res,
                403,
                false,
                null,
                `User role ${req.user.role} is not authorized to access this route`
            );
        }
        next();
    };
};

module.exports = authorize;
