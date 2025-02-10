const database = require('../database.json'); // Assuming you have a JSON file for user data

// Function to get user details
async function getUserDetails(userId) {
    return database[userId] || null; // Return user details or null if not found
}

// Function to update whitelist status (example)
async function updateWhitelistStatus(userId, status) {
    if (database[userId]) {
        database[userId].whitelisted = status; // Update the status
        // Save the updated database back to the JSON file if necessary
    }
}

module.exports = {
    getUserDetails,
    updateWhitelistStatus,
}; 