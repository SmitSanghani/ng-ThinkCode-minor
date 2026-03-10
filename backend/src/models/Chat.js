const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [
        {
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            text: { type: String, required: true },
            isInvite: { type: Boolean, default: false },
            roomId: { type: String, default: null },
            isRoomMessage: { type: Boolean, default: false }, // Track if sent from inside meeting
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { 
    timestamps: true 
});

// Index for quick lookup of specific conversation between two users
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Chat', conversationSchema);
