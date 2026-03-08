const User = require('../models/user.model');
const Submission = require('../models/submission.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { isUserOnline, getOnlineUserIds } = require('../socket');

exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        const query = { role: { $ne: 'admin' } };

        // Handle filter:
        // "Online"  → users currently in socket Map
        // "Offline" → users NOT in socket Map
        // "Banned"  → DB account status = Banned
        if (status === 'Online') {
            const onlineIds = getOnlineUserIds();
            query._id = { $in: onlineIds };
        } else if (status === 'Offline') {
            const onlineIds = getOnlineUserIds();
            query._id = { $nin: onlineIds };
        } else if (status === 'Banned') {
            query.status = 'Banned';
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

        const usersWithSubmissions = await Promise.all(users.map(async (user) => {
            const solvedCount = await Submission.distinct('question', {
                student: user._id,
                status: 'Accepted'
            });

            return {
                ...user.toObject(),
                submissionCount: solvedCount.length,
                isOnline: isUserOnline(user._id)
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
