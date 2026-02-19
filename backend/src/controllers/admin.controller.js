const Question = require('../models/question.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');

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
            referenceSolution
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
            referenceSolution
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
