module.exports = {
    WHITELIST: {
        ROLE_NAME: 'DBR WHITELISTED',  // The role name for whitelisted users
        ROLE_ID: process.env.whitelistRoleId,  // Replace with the actual role ID or use environment variable
        COMMAND: '!setupwhitelist',  // The command to start the whitelist process
        COOLDOWN: 60,  // Cooldown period in seconds
        COLOR: '#9400D3',  // Color for embeds
        QUESTIONS: [
            {
                text: "📜 **Do You Have Read All The Rules?**",  // Added emoji to question text
                options: [
                    { label: "❌ No", value: "wrong1" },  // Added emoji to options
                    { label: "✅ Yes", value: "correct1" }
                ],
                correct: "correct1"
            },
            {
                text: "🚫 **Is Vulgar Language Allowed In The Server?**",  // Added emoji to question text
                options: [
                    { label: "❌ No", description: "Treat everyone with respect", value: "correct2" },
                    { label: "💬 Yes", description: "Uses vulgar language", value: "wrong2" }
                ],
                correct: "correct2"
            },
            {
                text: "👊 **If Someone Calls You Vulgar Words, What Should You Do?**",  // Added emoji to question text
                options: [
                    { label: "📷 Record POV/Contact Admin", description: "Contact Admin", value: "correct3" },
                    { label: "🗣️ Start Arguing", description: "Respond back with vulgar language", value: "wrong3" }
                ],
                correct: "correct3"
            }
        ]
    },
};