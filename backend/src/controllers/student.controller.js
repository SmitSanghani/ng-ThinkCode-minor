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

            // 3. Process each question
            const studentPlan = req.user.plan || 'Free';
            const processedProblems = await Promise.all(questions.map(async (q) => {
                // Determine worldwide index for plan-based locking (rank by createdAt among SAME difficulty)
                const index = await Question.countDocuments({
                    difficulty: q.difficulty,
                    createdAt: { $lt: q.createdAt }
                });

                const isLocked = false; // Temporarily unlocked for testing

                // Check submission status
                const submissions = await Submission.find({
                    student: req.user.id,
                    question: q._id
                });

                let problemStatus = isLocked ? 'locked' : 'unsolved';
                if (submissions.length > 0) {
                    const hasPassed = submissions.some(s => s.status === 'passed');
                    problemStatus = hasPassed ? 'solved' : 'attempted';
                }

                return {
                    id: q._id,
                    title: q.title,
                    difficulty: q.difficulty,
                    category: q.category,
                    status: problemStatus,
                    isLocked: isLocked,
                    solvedCount: q.totalAccepted || 0
                };
            }));

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
                functionSignature: q.functionSignature
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
