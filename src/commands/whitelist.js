const { 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder
} = require('discord.js');

const questions = [
    {
        text: "📜 **Do You Have Read All The Rules?**",
        options: [
            { label: "❌ No", value: "wrong1" },
            { label: "✅ Yes", value: "correct1" }
        ],
        correct: "correct1"
    },
    {
        text: "🚫 **Is Vulgar Language Allowed In The Server?**",
        options: [
            { label: "❌ No", description: "Treat everyone with respect", value: "correct2" },
            { label: "💬 Yes", description: "Uses vulgar language", value: "wrong2" }
        ],
        correct: "correct2"
    },
    {
        text: "👊 **If Someone Calls You Vulgar Words, What Should You Do?**",
        options: [
            { label: "📷 Record POV/Contact Admin", description: "Contact Admin", value: "correct3" },
            { label: "🗣️ Start Arguing", description: "Respond back with vulgar language", value: "wrong3" }
        ],
        correct: "correct3"
    }
];

const userProgress = new Map();

module.exports = {
    name: '!whitelist',
    questions,
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        try {
            await message.delete();
            const whitelistEmbed = new EmbedBuilder()
                .setTitle('🔒 Whitelist Application')
                .setDescription('Welcome to our whitelist application process!\nClick the button below to begin.\n\n' +
                              '**Requirements:**\n' +
                              '• Answer all questions correctly\n' +
                              '• Follow server rules\n' +
                              '• Be patient during the process')
                .setColor(0xF228FE)
                .setImage("https://i.ibb.co/TBpgPSZ/background.png")
                .setTimestamp()
                .setFooter({ text: 'Powered by DBR' });

            const whitelistButton = new ButtonBuilder()
                .setCustomId('whitelist_button')
                .setLabel('Apply for Whitelist')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝');

            const row = new ActionRowBuilder()
                .addComponents(whitelistButton);

            await message.channel.send({
                embeds: [whitelistEmbed],
                components: [row]
            });
        } catch (error) {
            console.error('Error setting up whitelist:', error);
            await message.channel.send('❌ Failed to set up the whitelist system.');
        }
    },

    async handleButton(interaction) {
        try {
            userProgress.set(interaction.user.id, { questionIndex: 0, correctAnswers: 0 });
            await sendQuestion(interaction, 0);
        } catch (error) {
            console.error('Error handling whitelist button:', error);
            await interaction.reply({ content: '❌ An error occurred', flags: 64 });
        }
    },

    async handleSelectMenu(interaction) {
        const progress = userProgress.get(interaction.user.id);
        if (!progress) return;

        const currentQuestion = questions[progress.questionIndex];
        const selectedAnswer = interaction.values[0];

        if (selectedAnswer === currentQuestion.correct) {
            progress.correctAnswers++;
        }

        progress.questionIndex++;

        if (progress.questionIndex < questions.length) {
            await sendQuestion(interaction, progress.questionIndex);
        } else {
            await handleCompletion(interaction, progress.correctAnswers);
            userProgress.delete(interaction.user.id);
        }
    }
};

async function sendQuestion(interaction, index) {
    const question = questions[index];
    
    const embed = new EmbedBuilder()
        .setTitle('Whitelist Question')
        .setDescription(question.text)
        .setColor(0xF228FE)
        .setFooter({ text: `Question ${index + 1}/${questions.length}` });

    const select = new StringSelectMenuBuilder()
        .setCustomId(`whitelist_answer_${index}`)
        .setPlaceholder('Select your answer')
        .addOptions(question.options);

    const row = new ActionRowBuilder().addComponents(select);

    if (index === 0) {
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    } else {
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

async function handleCompletion(interaction, correctAnswers) {
    const passed = correctAnswers === questions.length;
    const roleId = process.env.WHITELIST_ROLE_ID;

    const embed = new EmbedBuilder()
        .setTitle(passed ? '✅ Whitelist Application Successful' : '❌ Whitelist Application Failed')
        .setDescription(passed ? 
            'Congratulations! You have been whitelisted.' : 
            `You answered ${correctAnswers}/${questions.length} questions correctly. Please try again.`)
        .setColor(passed ? 0x00FF00 : 0xFF0000);

    if (passed && roleId) {
        try {
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                console.error('Whitelist role not found');
                return;
            }

            await interaction.member.roles.add(role);

            const dmEmbed = new EmbedBuilder()
                .setTitle('🎉 Whitelist Application Successful!')
                .setDescription([
                    `Congratulations ${interaction.user.toString()}!`,
                    '',
                    '**You have successfully completed the whitelist application!**',
                    'You now have access to the whitelisted sections of our server.',
                    '',
                    '**Next Steps:**',
                    '• Check out the whitelisted channels',
                    '• Read any additional rules or guidelines',
                    '• Enjoy your new access!'
                ].join('\n'))
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: 'Powered by DBR' });

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Could not send DM to user:', error);
                embed.setFooter({ text: 'Note: Unable to send you a DM. Please check your privacy settings.' });
            }

            console.log(`Added whitelist role to ${interaction.user.tag}`);
        } catch (error) {
            console.error('Error adding role or sending DM:', error);
            embed.setDescription('⚠️ Passed but there was an error assigning the role. Please contact an administrator.');
        }
    }

    await interaction.update({ embeds: [embed], components: [] });
} 