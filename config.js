module.exports = {
    WHITELIST: {
        ROLE_NAME: 'DBR WHITELISTED',
        ROLE_ID: process.env.WHITELIST_ROLE_ID,
        COMMAND: '!whitelist',
        COOLDOWN: 60,
        COLOR: '#9400D3',
        QUESTIONS: [
            {
                text: "📜 **Have you read all the rules?**",
                options: [
                    { label: "❌ No", value: "wrong1" },
                    { label: "✅ Yes", value: "correct1" }
                ],
                correct: "correct1"
            },
            {
                text: "🚫 **Is vulgar language allowed in the server?**",
                options: [
                    { label: "❌ No", description: "Treat everyone with respect", value: "correct2" },
                    { label: "💬 Yes", description: "Uses vulgar language", value: "wrong2" }
                ],
                correct: "correct2"
            },
            {
                text: "👊 **If someone insults you, what should you do?**",
                options: [
                    { label: "📷 Record POV/Contact Admin", description: "Report to staff", value: "correct3" },
                    { label: "🗣️ Start arguing", description: "Respond back with vulgar language", value: "wrong3" }
                ],
                correct: "correct3"
            }
        ]
    },
};
