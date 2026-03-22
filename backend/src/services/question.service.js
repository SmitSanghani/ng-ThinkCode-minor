const questionRepository = require('../repositories/question.repository');
const XLSX = require('xlsx');

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
        const easy = await questionRepository.count({ difficulty: 'Easy' });
        const medium = await questionRepository.count({ difficulty: 'Medium' });
        const hard = await questionRepository.count({ difficulty: 'Hard' });

        return {
            total,
            breakdown: { easy, medium, hard }
        };
    }

    async bulkUploadQuestions(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        const mandatoryFields = ['title', 'difficulty', 'category', 'description', 'functionSignature'];
        const errors = [];

        data.forEach((row, index) => {
            const missing = mandatoryFields.filter(field => !row[field]);
            if (missing.length > 0) {
                errors.push({
                    row: index + 2, // Excel rows are 1-indexed, first row is header
                    missingFields: missing
                });
            }
        });

        if (errors.length > 0) {
            const error = new Error('Validation failed');
            error.missingFields = errors;
            throw error;
        }

        // Process and save
        const questionsToSave = data.map(row => {
            // Handle JSON strings for examples and testCases if they are strings in Excel
            if (typeof row.examples === 'string') {
                try { row.examples = JSON.parse(row.examples); } catch (e) { row.examples = []; }
            }
            if (typeof row.testCases === 'string') {
                try { row.testCases = JSON.parse(row.testCases); } catch (e) { row.testCases = []; }
            }

            // Explicitly handle isPremium conversion as Excel might read it as a string
            if (row.isPremium !== undefined && row.isPremium !== null) {
                if (typeof row.isPremium === 'string') {
                    row.isPremium = row.isPremium.toLowerCase() === 'true';
                } else if (typeof row.isPremium === 'boolean') {
                    // already boolean
                } else {
                    row.isPremium = Boolean(row.isPremium);
                }
            } else {
                row.isPremium = false;
            }

            return row;
        });

        const results = await Promise.all(questionsToSave.map(q => questionRepository.create(q)));
        return { count: results.length };
    }
}

module.exports = new QuestionService();
