const cron = require('node-cron');
const Chat = require('../models/Chat');
const Interview = require('../models/Interview');

/**
 * Initializes a cron job to clean up chat messages every 10 minutes.
 * Messages older than 10 minutes will be removed from the database.
 */
const initChatCleanupJob = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('[CRON] Starting 10-minute chat cleanup...');
        
        try {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            
            // 1. Cleanup Unified Chat
            const chatResult = await Chat.updateMany(
                {}, 
                { 
                    $pull: { 
                        messages: { 
                            createdAt: { $lt: tenMinutesAgo } 
                        } 
                    } 
                }
            );

            // 2. Cleanup Interview Room Messages
            const interviewResult = await Interview.updateMany(
                {},
                {
                    $pull: {
                        messages: {
                            timestamp: { $lt: tenMinutesAgo }
                        }
                    }
                }
            );

            console.log(`[CRON] Cleanup done: Chat(${chatResult.modifiedCount}), Interview(${interviewResult.modifiedCount})`);
        } catch (error) {
            console.error('[CRON] Chat cleanup failed:', error.message);
        }
    });

    console.log('[CRON] Chat cleanup scheduled: Every 10 minutes (Keep last 10min history)');
};

module.exports = initChatCleanupJob;
