const questionRepository = require('../repositories/question.repository');

class QuestionService {
    async createQuestion(data) {
        return await questionRepository.create(data);
    }

    async getAllQuestions(filters = {}) {
        const query = {};
        if (filters.difficulty) query.difficulty = filters.difficulty;
        if (filters.category) query.category = filters.category;
        if (filters.search) {
            query.title = { $regex: filters.search, $options: 'i' };
        }
        return await questionRepository.findAll(query);
    }

    async getQuestionById(id) {
        const question = await questionRepository.findById(id);
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }

    async updateQuestion(id, data) {
        const question = await questionRepository.update(id, data);
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }

    async deleteQuestion(id) {
        const question = await questionRepository.delete(id);
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }

    async getStats() {
        const total = await questionRepository.count();
        const easy = await questionRepository.count({ difficulty: 'easy' });
        const medium = await questionRepository.count({ difficulty: 'medium' });
        const hard = await questionRepository.count({ difficulty: 'hard' });

        return {
            total,
            breakdown: { easy, medium, hard }
        };
    }
}

module.exports = new QuestionService();
