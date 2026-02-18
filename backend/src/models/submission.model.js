const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    code: {
        type: String,
        required: [true, 'Please provide the code']
    },
    status: {
        type: String,
        enum: ['pending', 'passed', 'failed', 'compilation_error'],
        default: 'pending'
    },
    testResults: [{
        testCase: mongoose.Schema.Types.ObjectId,
        passed: Boolean,
        input: String,
        output: String,
        expectedOutput: String,
        error: String
    }],
    passedCount: {
        type: Number,
        default: 0
    },
    totalTests: {
        type: Number,
        default: 0
    },
    executionTime: Number, // in ms
    memoryUsage: Number, // in KB
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'F', 'Pending'],
        default: 'Pending'
    },
    aiExplanation: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
