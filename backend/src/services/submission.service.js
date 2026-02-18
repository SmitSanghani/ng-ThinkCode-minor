const submissionRepository = require('../repositories/submission.repository');

class SubmissionService {
    async submitSolution(studentId, questionId, code) {
        // Here we would normally run the code and check test cases
        // For now, we seed a pending submission
        return await submissionRepository.create({
            student: studentId,
            question: questionId,
            code,
            status: 'pending'
        });
    }

    async getAllSubmissions(filters = {}) {
        const query = {};
        if (filters.grade) query.grade = filters.grade;
        if (filters.status) query.status = filters.status;
        if (filters.studentId) query.student = filters.studentId;
        if (filters.questionId) query.question = filters.questionId;

        return await submissionRepository.findAll(query);
    }

    async getSubmissionById(id) {
        const submission = await submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Submission not found');
        }
        return submission;
    }

    async getStudentSubmissions(studentId) {
        return await submissionRepository.findByStudent(studentId);
    }

    async getAdminStats() {
        const total = await submissionRepository.count();
        const success = await submissionRepository.count({ status: 'passed' });
        const failed = await submissionRepository.count({ status: 'failed' });

        const grades = await submissionRepository.aggregateGrades();
        const timeline = await submissionRepository.getSubmissionStatsByDate();

        return {
            total,
            successRate: total > 0 ? (success / total) * 100 : 0,
            grades,
            timeline
        };
    }

    async updateGrade(id, grade) {
        const submission = await submissionRepository.update(id, { grade });
        if (!submission) {
            throw new Error('Submission not found');
        }
        return submission;
    }
}

module.exports = new SubmissionService();
