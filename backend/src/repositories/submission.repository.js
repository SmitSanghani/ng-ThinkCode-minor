const Submission = require('../models/submission.model');

class SubmissionRepository {
    async create(data) {
        return await Submission.create(data);
    }

    async findAll(query = {}) {
        return await Submission.find(query)
            .populate('student', 'username email')
            .populate('question', 'title difficulty')
            .sort({ submittedAt: -1 });
    }

    async findById(id) {
        return await Submission.findById(id)
            .populate('student', 'username email')
            .populate('question', 'title difficulty description');
    }

    async findByStudent(studentId) {
        return await Submission.find({ student: studentId })
            .populate('question', 'title difficulty')
            .sort({ submittedAt: -1 });
    }

    async update(id, data) {
        return await Submission.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    async count(query = {}) {
        return await Submission.countDocuments(query);
    }

    async aggregateGrades() {
        return await Submission.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } }
        ]);
    }

    async getSubmissionStatsByDate() {
        return await Submission.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 30 }
        ]);
    }
}

module.exports = new SubmissionRepository();
