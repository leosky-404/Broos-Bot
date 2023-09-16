/**
 * 
 * @param {Number} level 
 * @returns 
 */
function calculateLevelXP(level) {
    return 75 + (level * 100);
}

module.exports = calculateLevelXP;