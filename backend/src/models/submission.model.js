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
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Pending', 'Compilation Error'],
        default: 'Pending'
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
    runtime: Number, // in ms
    memory: Number, // in MB
    language: {
        type: String,
        default: 'javascript'
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'Pending'],
        default: 'Pending'
    },
    aiExplanation: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Performance Indexes for high-scale querying
SubmissionSchema.index({ student: 1, question: 1, status: 1 });
SubmissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
