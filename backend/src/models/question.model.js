const mongoose = require('mongoose');

const TextBoxSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }
}, { _id: false });

const TestCaseSchema = new mongoose.Schema({
    input: { type: Object, required: true },
    expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
    isSample: { type: Boolean, default: false }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a question title'],
        trim: true,
        unique: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: [true, 'Please add a difficulty level']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    examples: [TextBoxSchema],
    constraints: {
        type: String
    },
    testCases: {
        type: [TestCaseSchema],
        required: [true, 'Please add at least one test case'],
        validate: [


        ]
    },
    functionSignature: {
        type: String,
        required: [true, 'Please add the function signature']
    },
    referenceSolution: {
        type: String
    },
    totalSubmissions: {
        type: Number,
        default: 0
    },
    totalAccepted: {
        type: Number,
        default: 0
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Update updatedAt on save
QuestionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Question', QuestionSchema);
