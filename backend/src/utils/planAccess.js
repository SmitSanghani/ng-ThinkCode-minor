/**
 * Logic for plan-based locking
 * @param {string} studentPlan - 'Free', 'Premium'
 * @param {boolean} isPremiumOnly - Whether the question is premium only
 * @returns {boolean} - true if unlocked, false if locked
 */
const planAccessControl = (studentPlan, isPremiumOnly) => {
    if (studentPlan === 'Premium') return true;
    if (!isPremiumOnly) return true; // Available for Free users
    return false; // Premium question and Free user
};

module.exports = { planAccessControl };
