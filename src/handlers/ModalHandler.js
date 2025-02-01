// File: src/handlers/ModalHandler.js
const { EmbedBuilder } = require('discord.js');
const COLORS = require('../utils/colors');  // Adjust the path according to your project structure

class ModalHandler {
    static async handleSayModal(interaction) {
        try {
            // Extract channel ID from customId
            const channelId = interaction.customId.split('-')[1];
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return interaction.reply({
                    content: 'The target channel no longer exists!',
                    flags: 64
                });
            }

            // Get values from modal
            const title = interaction.fields.getTextInputValue('titleInput');
            const content = interaction.fields.getTextInputValue('messageInput');
            const imageUrl = interaction.fields.getTextInputValue('imageInput');
            const colorInput = interaction.fields.getTextInputValue('colorInput').toLowerCase();

            // Create embed
            const embed = new EmbedBuilder()
                .setDescription(content)
                .setTimestamp()
                .setFooter({ text: 'Powered by DBR' });

            // Set title if provided
            if (title) {
                embed.setTitle(title);
            }

            // Set color if provided
            if (colorInput) {
                const color = COLORS[colorInput] || parseInt(colorInput.replace('#', ''), 16) || null;
                if (color) {
                    embed.setColor(color);
                }
            }

            // Set image if valid URL provided
            if (imageUrl) {
                try {
                    new URL(imageUrl);
                    embed.setImage(imageUrl);
                } catch (error) {
                    return interaction.reply({
                        content: 'Invalid image URL provided!',
                        flags: 64
                    });
                }
            }

            // Send the message
            await channel.send({ embeds: [embed] });
            
            // Confirm to user
            await interaction.reply({
                content: `Message sent successfully to ${channel}!`,
                flags: 64
            });

        } catch (error) {
            console.error('Error handling say modal:', error);
            await interaction.reply({
                content: 'There was an error while sending your message.',
                flags: 64
            });
        }
    }
}

module.exports = {
    event: "interactionCreate",
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        // Handle different modal types
        if (interaction.customId.startsWith('sayModal-')) {
            await ModalHandler.handleSayModal(interaction);
        }
        // Add more modal handlers here as needed
    }
};