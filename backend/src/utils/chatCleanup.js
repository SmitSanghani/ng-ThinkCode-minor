const cron = require('node-cron');
const Chat = require('../models/Chat');

/**
 * Initializes a cron job to clean up old chat messages every hour.
 * Messages older than 1 hour will be removed from the database.
 */
const initChatCleanupJob = () => {
    // Run every hour at the beginning of the hour (0 minutes)
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Starting chat history cleanup...');
        
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            // Find all chats and remove messages older than 1 hour
            // $pull is used to remove elements from an array that match a condition
            const result = await Chat.updateMany(
                {}, 
                { 
                    $pull: { 
                        messages: { 
                            createdAt: { $lt: oneHourAgo } 
                        } 
                    } 
                }
            );

            // Optional: Completely remove chat documents that have no messages left
            // await Chat.deleteMany({ messages: { $size: 0 } });

            console.log(`[CRON] Chat cleanup completed. Modified ${result.modifiedCount} chat documents.`);
        } catch (error) {
            console.error('[CRON] Chat cleanup failed:', error.message);
        }
    });

    console.log('[CRON] Chat history cleanup job scheduled (Every 1 hour)');
};

module.exports = initChatCleanupJob;
