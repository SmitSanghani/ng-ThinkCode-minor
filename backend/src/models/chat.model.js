const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'model'],
        required: true
    },
    content: {
        type: String
    },
    // For assistant messages, we store structured data
    grade: {
        type: String
    },
    explanation: {
        type: String
    },
    hints: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSchema = new mongoose.Schema({
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
    messages: [ChatMessageSchema]
}, { timestamps: true });

// Ensure one chat document per student per question
ChatSchema.index({ student: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);
