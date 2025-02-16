const { 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits
} = require('discord.js');
const { saveUserDetails, getUserDetails, updateWhitelistStatus } = require('../database');
const config = require('../../config');
const moment = require('moment');

const questions = config.WHITELIST.QUESTIONS;
const userProgress = new Map();

module.exports = {
    name: config.WHITELIST.COMMAND,
    async execute(message) {
        console.log(`Whitelist command executed by: ${message.author.tag}`);
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            console.log(`User ${message.author.tag} lacks permission.`);
            return message.reply('❌ You do not have permission to use this command.');
        }

        try {
            await message.delete();
            console.log('Whitelist setup message sent.');
            const whitelistEmbed = new EmbedBuilder()
                .setTitle('🔒 Whitelist Application')
                .setDescription('Welcome to our whitelist application process!\nClick the button below to begin.\n\n' +
                              '**Requirements:**\n' +
                              '• Answer all questions correctly\n' +
                              '• Follow server rules\n' +
                              '• Be patient during the process')
                .setColor(config.WHITELIST.COLOR)
                .setImage("https://i.ibb.co/TBpgPSZ/background.png")
                .setTimestamp()
                .setFooter({ text: 'Powered by DBR' });

            const whitelistButton = new ButtonBuilder()
                .setCustomId('whitelist_button')
                .setLabel('Apply for Whitelist')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝');

            const row = new ActionRowBuilder().addComponents(whitelistButton);

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
        console.log(`Button interaction received: ${interaction.customId}`);
        try {
            userProgress.set(interaction.user.id, { questionIndex: 0, correctAnswers: 0 });
            await sendQuestion(interaction, 0);
        } catch (error) {
            console.error('Error handling whitelist button:', error);
            await interaction.reply({ content: '❌ An error occurred', flags: 64 });
        }
    },

    async handleSelectMenu(interaction) {
        console.log(`Select menu interaction received: ${interaction.customId}`);
        const progress = userProgress.get(interaction.user.id);
        if (!progress) return;

        const currentQuestion = questions[progress.questionIndex];
        const selectedAnswer = interaction.values[0];

        console.log(`User ${interaction.user.tag} answered: ${selectedAnswer}`);

        if (selectedAnswer === currentQuestion.correct) {
            console.log('Answer is correct.');
            progress.correctAnswers++;
        } else {
            console.log('Answer is incorrect.');
        }

        progress.questionIndex++;

        if (progress.questionIndex < questions.length) {
            await sendQuestion(interaction, progress.questionIndex);
        } else {
            await handleCompletion(interaction, progress.correctAnswers);
            userProgress.delete(interaction.user.id);
        }
    },

    // Prefix Command Handler
    prefixHandler: async (client, message) => {
        const prefix = '!';
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        if (commandName === config.WHITELIST.COMMAND.replace('!', '')) {
            await module.exports.execute(message);
        }
    }
};

async function sendQuestion(interaction, index) {
    console.log(`Sending question ${index + 1}/${questions.length} to ${interaction.user.tag}`);
    const question = questions[index];
    
    const embed = new EmbedBuilder()
        .setTitle('Whitelist Question')
        .setDescription(question.text)
        .setColor(config.WHITELIST.COLOR)
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
    console.log(`User ${interaction.user.tag} completed whitelist with ${correctAnswers}/${questions.length} correct answers.`);
    const passed = correctAnswers === questions.length;
    const roleId = config.WHITELIST.ROLE_ID;

    if (!roleId) {
        console.error('Whitelist role ID is not defined in config.');
        return;
    }

    await updateWhitelistStatus(interaction.user.id, passed ? 'approved' : 'rejected');

    const embed = new EmbedBuilder()
        .setTitle(passed ? '✅ Whitelist Application Successful' : '❌ Whitelist Application Failed')
        .setDescription(passed ? 'Congratulations! You have been whitelisted.' : `You answered ${correctAnswers}/${questions.length} questions correctly. Please try again.`)
        .setColor(passed ? 0x00FF00 : 0xFF0000);

    if (passed) {
        console.log(`Assigning role ${roleId} to ${interaction.user.tag}`);
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            console.error('Whitelist role not found');
            return;
        }
        await interaction.member.roles.add(role);
    }

    await interaction.update({ embeds: [embed], components: [] });
}
