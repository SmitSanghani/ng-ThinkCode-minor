const Question = require('../models/question.model');
const User = require('../models/user.model');
const Submission = require('../models/submission.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { isUserOnline } = require('../socket');

// @desc    Add a new question
// @route   POST /api/admin/questions/add
// @access  Private (Admin)
exports.addQuestion = async (req, res, next) => {
    try {
        const {
            title,
            difficulty,
            category,
            description,
            examples,
            constraints,
            testCases,
            functionSignature,
            referenceSolution,
            isPremium
        } = req.body;

        // Check for duplicate title
        const existingQuestion = await Question.findOne({ title });
        if (existingQuestion) {
            return sendError(res, 'Question with this title already exists', 409);
        }

        const question = await Question.create({
            title,
            difficulty,
            category,
            description,
            examples,
            constraints,
            testCases,
            functionSignature,
            referenceSolution,
            isPremium
        });

        sendSuccess(res, { questionId: question._id }, 'Question added successfully', 201);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return sendError(res, messages.join(', '), 400);
        }
        next(error);
    }
};

// @desc    Get all questions
// @route   GET /api/admin/questions
// @access  Private (Admin)
exports.getQuestions = async (req, res, next) => {
    try {
        console.log('AdminController: getQuestions called');
        console.log('User:', req.user?._id, req.user?.role);
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const query = {};

        // Filtering
        if (req.query.difficulty) {
            query.difficulty = req.query.difficulty;
        }
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' };
        }

        const total = await Question.countDocuments(query);
        const questions = await Question.find(query)
            .select('-referenceSolution -testCases -examples') // Exclude sensitive fields
            .skip(startIndex)
            .limit(limit)
            .lean(); // Convert to plain JS objects for easier modification

        // Calculate success rate
        const questionsWithStats = questions.map(q => {
            const successRate = q.totalSubmissions > 0
                ? (q.totalAccepted / q.totalSubmissions) * 100
                : 0;
            return {
                ...q,
                successRate: parseFloat(successRate.toFixed(2))
            };
        });

        const pagination = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };

        res.set('Cache-Control', 'no-store');
        sendSuccess(res, { questions: questionsWithStats, pagination });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single question by ID
// @route   GET /api/admin/questions/:id
// @access  Private (Admin)
exports.getQuestionById = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return sendError(res, 'Question not found', 404);
        }

        sendSuccess(res, question);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return sendError(res, 'Question not found', 404);
        }
        next(error);
    }
};

// @desc    Update question
// @route   PUT /api/admin/questions/:id
// @access  Private (Admin)
exports.updateQuestion = async (req, res, next) => {
    try {
        let question = await Question.findById(req.params.id);

        if (!question) {
            return sendError(res, 'Question not found', 404);
        }

        // Check for duplicate title if title is being updated
        if (req.body.title && req.body.title !== question.title) {
            const existingTitle = await Question.findOne({ title: req.body.title });
            if (existingTitle) {
                return sendError(res, 'Question with this title already exists', 409);
            }
        }

        question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        sendSuccess(res, question, 'Question updated successfully');
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return sendError(res, messages.join(', '), 400);
        }
        if (error.kind === 'ObjectId') {
            return sendError(res, 'Question not found', 404);
        }
        next(error);
    }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private (Admin)
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return sendError(res, 'Question not found', 404);
        }

        await question.deleteOne();

        // Optional: Delete related submissions
        // await Submission.deleteMany({ question: req.params.id });

        sendSuccess(res, {}, 'Question deleted successfully');
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return sendError(res, 'Question not found', 404);
        }
        next(error);
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Real-time online count — ONLY from active socket connections (like a chat app)
        const { getActiveUsersCount } = require('../socket');
        const onlineUsersNow = getActiveUsersCount();

        const totalSubmissions = await Submission.countDocuments();
        const activeQuestions = await Question.countDocuments();

        // Avg Completion Rate (Accepted submissions / Total Submissions)
        // Using $group to get total submissions and total accepted
        const submissionStats = await Submission.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
                    avgTime: { $avg: "$runtime" }
                }
            }
        ]);

        const stats = submissionStats[0] || { total: 0, accepted: 0, avgTime: 0 };
        const avgCompletion = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0;

        // Active Users Today (Users who submitted something today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeUsersToday = await Submission.distinct('student', {
            submittedAt: { $gte: today }
        });

        // Submission Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const submissionTrend = await Submission.aggregate([
            {
                $match: {
                    submittedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Grade Distribution
        const gradeDistribution = await Submission.aggregate([
            {
                $group: {
                    _id: "$grade",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map gradeDistribution result for easier frontend use
        const gradeMap = {};
        gradeDistribution.forEach(g => {
            gradeMap[g._id || 'Pending'] = g.count;
        });

        sendSuccess(res, {
            topCards: {
                totalStudents,
                activeStudents: onlineUsersNow,
                totalSubmissions,
                activeQuestions,
                avgCompletion: parseFloat(avgCompletion.toFixed(1))
            },
            platformStats: {
                questionsCompleted: stats.accepted,
                avgTimePerQuestion: Math.round(stats.avgTime || 0),
                onlineUsersNow,
                activeUsersToday: activeUsersToday.length,
                successRate: parseFloat(avgCompletion.toFixed(1))
            },
            submissionTrend,
            gradeDistribution: gradeMap
        });
    } catch (error) {
        next(error);
    }
};
