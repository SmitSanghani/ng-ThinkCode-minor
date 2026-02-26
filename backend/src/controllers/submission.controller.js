const submissionService = require('../services/submission.service');
const { sendSuccess } = require('../utils/responseHandler');

class SubmissionController {
    async submitSolution(req, res, next) {
        try {
            console.log(`[SubmissionController] Attempting submit for user: ${req.user.id}, question: ${req.body.questionId}`);
            const submission = await submissionService.submitSolution(
                req.user.id,
                req.body.questionId,
                req.body.code
            );
            res.status(200).json({ success: true, data: submission });
        } catch (error) {
            next(error);
        }
    }

    async getLatestSubmission(req, res, next) {
        try {
            const submission = await submissionService.getLatestAcceptedSubmission(
                req.user.id,
                req.params.questionId
            );
            res.status(200).json({ success: true, data: submission });
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

    async deleteSubmission(req, res, next) {
        try {
            await submissionService.deleteSubmission(req.params.id);
            sendSuccess(res, null, 'Submission deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getUserSubmissions(req, res, next) {
        try {
            const submissions = await submissionService.getStudentSubmissions(req.params.userId);
            sendSuccess(res, submissions, 'User submissions retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SubmissionController();
