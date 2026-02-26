const User = require('../models/user.model');
const Submission = require('../models/submission.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        const query = { role: { $ne: 'admin' } };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Enhance users with submission count
        const usersWithSubmissions = await Promise.all(users.map(async (user) => {
            const submissionCount = await Submission.countDocuments({ student: user._id });
            return {
                ...user.toObject(),
                submissionCount
            };
        }));

        sendSuccess(res, {
            users: usersWithSubmissions,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page
        }, 'Users retrieved successfully');
    } catch (error) {
        next(error);
    }
};
