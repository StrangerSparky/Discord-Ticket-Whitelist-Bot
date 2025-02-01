const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');

const COLORS = require('../utils/colors');  // Import the colors.js file

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Open a modal to send a custom message')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Select the channel to send the message to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        
        // Check if bot has permission to send messages in the target channel
        if (!targetChannel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                content: `I don't have permission to send messages in ${targetChannel}!`,
                flags: 64
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId(`sayModal-${targetChannel.id}`)
            .setTitle(`Send Message to #${targetChannel.name}`);

        // Add title input
        const titleInput = new TextInputBuilder()
            .setCustomId('titleInput')
            .setLabel('Message Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the title for your message')
            .setRequired(false)
            .setMaxLength(256);

        // Add message input
        const messageInput = new TextInputBuilder()
            .setCustomId('messageInput')
            .setLabel('Message Content')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your message content')
            .setRequired(true)
            .setMaxLength(4000);

        // Add image URL input
        const imageInput = new TextInputBuilder()
            .setCustomId('imageInput')
            .setLabel('Image URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter an image URL (optional)')
            .setRequired(false);

        // Add color input
        const colorInput = new TextInputBuilder()
            .setCustomId('colorInput')
            .setLabel('Embed Color')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('red, blue, green, yellow, purple, etc.')
            .setRequired(false);

        // Create action rows for each input
        const titleRow = new ActionRowBuilder().addComponents(titleInput);
        const messageRow = new ActionRowBuilder().addComponents(messageInput);
        const imageRow = new ActionRowBuilder().addComponents(imageInput);
        const colorRow = new ActionRowBuilder().addComponents(colorInput);

        // Add inputs to the modal
        modal.addComponents(titleRow, messageRow, imageRow, colorRow);

        // Show the modal
        await interaction.showModal(modal);
    },
};
