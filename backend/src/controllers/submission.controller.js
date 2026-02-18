const submissionService = require('../services/submission.service');
const { sendSuccess } = require('../utils/responseHandler');

class SubmissionController {
    async submitSolution(req, res, next) {
        try {
            const submission = await submissionService.submitSolution(
                req.user.id,
                req.body.questionId,
                req.body.code
            );
            sendSuccess(res, submission, 'Solution submitted successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllSubmissions(req, res, next) {
        try {
            const submissions = await submissionService.getAllSubmissions(req.query);
            sendSuccess(res, submissions, 'Submissions retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getSubmission(req, res, next) {
        try {
            const submission = await submissionService.getSubmissionById(req.params.id);
            sendSuccess(res, submission, 'Submission retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMySubmissions(req, res, next) {
        try {
            const submissions = await submissionService.getStudentSubmissions(req.user.id);
            sendSuccess(res, submissions, 'Your submissions retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAdminStats(req, res, next) {
        try {
            const stats = await submissionService.getAdminStats();
            sendSuccess(res, stats, 'Submission statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateGrade(req, res, next) {
        try {
            const submission = await submissionService.updateGrade(req.params.id, req.body.grade);
            sendSuccess(res, submission, 'Submission grade updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SubmissionController();
