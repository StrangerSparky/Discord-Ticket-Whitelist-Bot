const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');
const config = require('../../config');  // Import the config

// Store cooldowns and user progress in Maps for efficient access
const cooldowns = new Map();
const userProgress = new Map();

module.exports = (client) => {

    // Interaction handler
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

        const userId = interaction.user.id;

        try {
            // Cooldown check
            if (await handleCooldown(interaction, userId)) return;

            // Handle button click
            if (interaction.isButton() && interaction.customId === 'whitelist_button') {
                await handleButtonClick(interaction, userId);
                return;
            }

            // Handle select menu interaction (answers to questions)
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction, userId);
            }
        } catch (error) {
            console.error('Error in interaction handler:', error);
            await handleError(interaction);
        }
    });
};

// Helper functions

async function handleCooldown(interaction, userId) {
    if (cooldowns.has(userId)) {
        const cooldownEnd = cooldowns.get(userId);
        if (Date.now() < cooldownEnd) {
            const timeLeft = Math.ceil((cooldownEnd - Date.now()) / 1000);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⏳ Cooldown Active')
                        .setDescription(`Please wait **${timeLeft} seconds** before trying again.`)
                        .setFooter({ text: 'This helps prevent spam and abuse' })
                ],
                flags: 64
            });
            return true;
        }
    }
    return false;
}

async function handleButtonClick(interaction, userId) {
    // Initialize user progress
    if (!userProgress.has(userId)) {
        userProgress.set(userId, { currentQuestion: 1, answers: [] });
    }

    // Send the first question
    await interaction.reply({
        embeds: [createQuestionEmbed(1)],
        components: [createQuestionMenu(1)],
        flags: 64
    });
}

async function handleSelectMenu(interaction, userId) {
    let progress = userProgress.get(userId);

    // If progress is not found, reinitialize it
    if (!progress) {
        console.log(`Progress not found for user ${userId}, initializing.`);
        progress = { currentQuestion: 1, answers: [] };
        userProgress.set(userId, progress);
    }

    const questionNumber = parseInt(interaction.customId.split('_')[1]);
    const selectedAnswer = interaction.values[0];
    const question = config.WHITELIST.QUESTIONS[questionNumber - 1];  // Access questions from config

    // Add the selected answer to the user's progress
    progress.answers.push(selectedAnswer);

    console.log(`User ${userId} answered question ${questionNumber}:`, selectedAnswer);

    // Check if all answers are selected and move to the next question if necessary
    if (questionNumber === 1) {
        progress.currentQuestion = 2;
        await interaction.update({
            embeds: [createQuestionEmbed(2)],
            components: [createQuestionMenu(2)],
            flags: 64
        });
    } else if (questionNumber === 2) {
        progress.currentQuestion = 3;
        await interaction.update({
            embeds: [createQuestionEmbed(3)],
            components: [createQuestionMenu(3)],
            flags: 64
        });
    } else if (questionNumber === 3) {
        // Once all questions are answered, check the answers
        await checkAllAnswers(interaction, userId);
    }
}

async function checkAllAnswers(interaction, userId) {
    const progress = userProgress.get(userId);

    // If progress is not found, log and stop
    if (!progress) {
        console.error('User progress not found');
        return;
    }

    const allAnswers = progress.answers;

    console.log(`Checking answers for user ${userId}:`, allAnswers);

    // Check if all answers are correct
    if (allAnswers[0] === config.WHITELIST.QUESTIONS[0].correct &&
        allAnswers[1] === config.WHITELIST.QUESTIONS[1].correct &&
        allAnswers[2] === config.WHITELIST.QUESTIONS[2].correct) {
        
        // All answers are correct, grant whitelist
        await handleCorrectWhitelist(interaction);
    } else {
        // One or more answers are incorrect, notify the user
        await handleWrongAnswer(interaction, userId);
    }
}

async function handleCorrectWhitelist(interaction) {
    try {
        const member = interaction.member;
        const whitelistRole = interaction.guild.roles.cache.get(config.WHITELIST.ROLE_ID);  // Use role ID from config

        if (!whitelistRole) {
            throw new Error('Whitelist role not found');
        }

        // Assign the whitelist role to the user
        await member.roles.add(whitelistRole);

        // Send congratulations DM to the user
        await sendCongratulationsDM(interaction);

        // Send success message to the interaction channel
        await interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Application Successful')
                    .setDescription('You have been successfully whitelisted! Check your DMs for more information.')
                    .setTimestamp()
            ],
            components: [],
            flags: 64
        });

    } catch (error) {
        console.error('Error in whitelist process:', error);
        await handleError(interaction);
    }
}

async function sendCongratulationsDM(interaction) {
    const successEmbed = new EmbedBuilder()
        .setTitle('🎉 Congratulations!')
        .setDescription('You have successfully completed the whitelist application!')
        .setColor('#00ff00')
        .addFields(
            { name: '✅ Status', value: 'Whitelisted', inline: true },
            { name: '🏷️ Role', value: 'Added', inline: true },
            { name: '📅 Date', value: new Date().toLocaleDateString(), inline: true }
        )
        .setImage("https://i.ibb.co/q8QqGGd/promo.gif")
        .setTimestamp()
        .setFooter({ text: "Powerd By DBR" });

    await interaction.user.send({ embeds: [successEmbed] });
}

async function handleWrongAnswer(interaction, userId) {
    userProgress.delete(userId); // Remove the user's progress
    cooldowns.set(userId, Date.now() + config.WHITELIST.COOLDOWN * 1000); // Use the cooldown value from config
    await interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Incorrect Answer')
                .setDescription('Your answer was incorrect. Please try again after the cooldown period.')
                .addFields({ name: 'Cooldown', value: `⏳ ${config.WHITELIST.COOLDOWN} seconds`, inline: true })
                .setTimestamp()
        ],
        components: [],
        flags: 64
    });
}

async function handleError(interaction) {
    const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your request. Please contact an administrator.')
        .setTimestamp();

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed], components: [], flags: 64 });
    } else {
        await interaction.reply({ embeds: [errorEmbed], flags: 64 });
    }
}

function createWhitelistButton(channel) {
    const button = new ButtonBuilder()
        .setCustomId('whitelist_button')
        .setLabel('Apply for Whitelist')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

    const row = new ActionRowBuilder().addComponents(button);

    return channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('🔒 Whitelist Application')
                .setImage("https://i.ibb.co/TBpgPSZ9/background.png")
                .setDescription('Welcome to our whitelist application process! Click the button below to begin.\n\n' +
                              '**Requirements:**\n' +
                              '• Answer all questions correctly\n' +
                              '• Follow server rules\n' +
                              '• Be patient during the process')
                .setColor(config.WHITELIST.COLOR)
                .setTimestamp()
                .setFooter({ text: 'Powered by DBR' })
        ],
        components: [row]
    });
}

function createQuestionEmbed(questionNumber) {
    const question = config.WHITELIST.QUESTIONS[questionNumber - 1];  // Access questions from config
    return new EmbedBuilder()
        .setTitle(`Question ${questionNumber} of ${config.WHITELIST.QUESTIONS.length}`)
        .setDescription(question.text)
        .setColor(config.WHITELIST.COLOR)  // Use color from config
        .setFooter({ 
            text: `Progress: ${questionNumber}/${config.WHITELIST.QUESTIONS.length} • Choose carefully!` 
        })
        .setTimestamp();
}

function createQuestionMenu(questionNumber) {
    const question = config.WHITELIST.QUESTIONS[questionNumber - 1];  // Access questions from config
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`question_${questionNumber}`)
            .setPlaceholder('Select your answer')
            .addOptions(question.options)
    );
}
