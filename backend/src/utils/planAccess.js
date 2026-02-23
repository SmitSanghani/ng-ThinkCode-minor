/**
 * Logic for plan-based locking
 * @param {string} studentPlan - 'Free', 'Basic', 'Premium'
 * @param {string} difficulty - 'Easy', 'Medium', 'Hard'
 * @param {number} problemIndex - 0-based index of the problem when sorted by createdAt
 * @returns {boolean} - true if unlocked, false if locked
 */
const planAccessControl = (studentPlan, difficulty, problemIndex) => {
    if (studentPlan === 'Premium') return true;

    if (studentPlan === 'Free') {
        if (difficulty === 'Easy') return problemIndex < 10;
        return false; // Medium and Hard are locked
    }

    if (studentPlan === 'Basic') {
        if (difficulty === 'Easy') return true;
        if (difficulty === 'Medium') return problemIndex < 20;
        return false; // Hard is locked
    }

    return false;
};

module.exports = { planAccessControl };
