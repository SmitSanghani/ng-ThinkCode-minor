const questionService = require('../services/question.service');
const { sendSuccess } = require('../utils/responseHandler');

class QuestionController {
    async createQuestion(req, res, next) {
        try {
            const question = await questionService.createQuestion(req.body);
            sendSuccess(res, question, 'Question created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllQuestions(req, res, next) {
        try {
            const questions = await questionService.getAllQuestions(req.query);
            sendSuccess(res, questions, 'Questions retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getQuestion(req, res, next) {
        try {
            const question = await questionService.getQuestionById(req.params.id);
            sendSuccess(res, question, 'Question retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateQuestion(req, res, next) {
        try {
            const question = await questionService.updateQuestion(req.params.id, req.body);
            sendSuccess(res, question, 'Question updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteQuestion(req, res, next) {
        try {
            await questionService.deleteQuestion(req.params.id);
            sendSuccess(res, null, 'Question deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await questionService.getStats();
            sendSuccess(res, stats, 'Question statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QuestionController();
