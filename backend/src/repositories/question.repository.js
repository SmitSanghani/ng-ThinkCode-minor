const Question = require('../models/question.model');

class QuestionRepository {
    async create(data) {
        return await Question.create(data);
    }

    async findAll(query = {}) {
        return await Question.find(query).sort({ createdAt: -1 });
    }

    async findById(id) {
        return await Question.findById(id);
    }

    async update(id, data) {
        return await Question.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    async delete(id) {
        return await Question.findByIdAndDelete(id);
    }

    async count(query = {}) {
        return await Question.countDocuments(query);
    }
}

module.exports = new QuestionRepository();
