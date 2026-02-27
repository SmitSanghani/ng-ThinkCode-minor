const aiService = require('../services/ai.service');
const Question = require('../models/question.model');
const Chat = require('../models/chat.model');

/**
 * Get chat history for a specific problem
 */
exports.getChatHistory = async (req, res) => {
    try {
        const { problemId } = req.params;
        const studentId = req.user.id;

        const chat = await Chat.findOne({
            student: studentId,
            question: problemId
        });

        res.status(200).json({
            success: true,
            data: chat ? chat.messages : []
        });

    } catch (error) {
        console.error('Get Chat History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history.'
        });
    }
};

/**
 * Controller for AI-related operations
 */
exports.getAIFeedback = async (req, res) => {
    try {
        const { code, problemId, history } = req.body;
        const studentId = req.user.id;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'No code provided for analysis.'
            });
        }

        // Optional: Fetch problem context if ID provided
        let problemContext = {};
        if (problemId) {
            const problem = await Question.findById(problemId);
            if (problem) {
                problemContext = {
                    title: problem.title,
                    difficulty: problem.difficulty
                };
            }
        }

        const feedback = await aiService.getCodeFeedback(code, problemContext, history);

        // PERSIST HISTORY: Save if problemId exists
        if (problemId) {
            // Construct the latest history including the new feedback
            const currentHistory = history || [];
            const fullHistory = [...currentHistory, {
                role: 'assistant',
                grade: feedback.grade,
                explanation: feedback.explanation,
                hints: feedback.improvementHints,
                timestamp: new Date()
            }];

            try {
                await Chat.findOneAndUpdate(
                    { student: studentId, question: problemId },
                    { messages: fullHistory },
                    { upsert: true, new: true }
                );
            } catch (saveError) {
                console.error('Failed to save chat history:', saveError);
                // Don't fail the whole request if saving history fails
            }
        }

        res.status(200).json({
            success: true,
            data: feedback
        });

    } catch (error) {
        console.error('AI Controller Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while getting AI feedback.'
        });
    }
};
