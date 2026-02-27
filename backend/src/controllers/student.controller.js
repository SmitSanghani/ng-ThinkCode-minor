const Question = require('../models/question.model');
const Submission = require('../models/submission.model');
const { planAccessControl } = require('../utils/planAccess');
const { responseHandler } = require('../utils/responseHandler');

class StudentController {
    /**
     * GET /api/student/problems
     */
    async getProblems(req, res, next) {
        try {
            const { page = 1, limit = 12, difficulty, category, search } = req.query;
            const skip = (page - 1) * limit;

            // 1. Build Question Filter
            const query = {};
            if (difficulty) query.difficulty = difficulty;
            if (category) query.category = category;
            if (search) query.title = { $regex: search, $options: 'i' };

            // 2. Fetch Questions
            const total = await Question.countDocuments(query);
            const questions = await Question.find(query)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            // 3. Optimized Status Fetch: Get all submissions for these questions for this user in ONE query
            const questionIds = questions.map(q => q._id);
            const userSubmissions = await Submission.find({
                student: req.user.id,
                question: { $in: questionIds }
            }).select('question status').lean();

            // Create a lookup map: questionId -> best status
            // Priority: Accepted/passed > any other status
            const statusMap = {};
            userSubmissions.forEach(sub => {
                const qId = sub.question.toString();
                const s = (sub.status || '').toLowerCase();
                const currentBest = (statusMap[qId] || '').toLowerCase();

                // If we found a success, or if we haven't found anything yet, update
                if (s === 'accepted' || s === 'passed') {
                    statusMap[qId] = 'Accepted';
                } else if (!statusMap[qId]) {
                    statusMap[qId] = sub.status; // Keep original for reference
                }
            });

            // 4. Process each question
            const processedProblems = questions.map(q => {
                const qId = q._id.toString();
                const rawStatus = statusMap[qId];
                const cleanStatus = (rawStatus || '').toLowerCase();

                let problemStatus = 'unsolved';
                if (cleanStatus === 'accepted' || cleanStatus === 'passed') {
                    problemStatus = 'solved';
                } else if (rawStatus) {
                    problemStatus = 'attempted';
                }

                return {
                    id: q._id,
                    title: q.title,
                    difficulty: q.difficulty,
                    category: q.category,
                    status: problemStatus,
                    isLocked: false,
                    acceptanceRate: q.totalSubmissions > 0
                        ? (q.totalAccepted / q.totalSubmissions * 100).toFixed(1) + '%'
                        : '0.0%',
                    solvedCount: q.totalAccepted || 0
                };
            });

            res.status(200).json({
                success: true,
                problems: processedProblems,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/student/problems/:id
     */
    async getProblemById(req, res, next) {
        try {
            const q = await Question.findById(req.params.id);
            if (!q) {
                return responseHandler(res, 404, false, null, 'Problem not found');
            }

            const studentPlan = req.user.plan || 'Free';
            const index = await Question.countDocuments({
                difficulty: q.difficulty,
                createdAt: { $lt: q.createdAt }
            });

            // Temporarily bypassed for testing
            // if (!planAccessControl(studentPlan, q.difficulty, index)) {
            //     return responseHandler(res, 403, false, null, 'Upgrade plan to access this problem');
            // }

            const filteredSamples = q.testCases.filter(tc => tc.isSample);
            const sampleTestCases = filteredSamples.length > 0 ? filteredSamples : q.testCases.slice(0, 2);

            const problemData = {
                id: q._id,
                index: index + 1, // Add 1 because index gives count of strictly older problems
                title: q.title,
                difficulty: q.difficulty,
                category: q.category,
                description: q.description,
                examples: q.examples,
                constraints: q.constraints,
                sampleTestCases: sampleTestCases,
                testCases: q.testCases, // Forward all to frontend as a backup
                functionSignature: q.functionSignature,
                referenceSolution: q.referenceSolution
            };

            responseHandler(res, 200, true, problemData);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/student/problems/:id/check-access
     */
    async checkAccess(req, res, next) {
        try {
            const q = await Question.findById(req.params.id);
            if (!q) {
                return responseHandler(res, 404, false, null, 'Problem not found');
            }

            const studentPlan = req.user.plan || 'Free';
            const index = await Question.countDocuments({
                difficulty: q.difficulty,
                createdAt: { $lt: q.createdAt }
            });

            const hasAccess = planAccessControl(studentPlan, q.difficulty, index);

            res.status(200).json({
                success: true,
                hasAccess,
                plan: studentPlan,
                reason: hasAccess ? 'Unlocked' : `Locked for ${studentPlan} plan`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new StudentController();
