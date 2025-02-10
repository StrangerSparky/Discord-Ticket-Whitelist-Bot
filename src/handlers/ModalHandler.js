const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const COLORS = require('../utils/colors');


const parseColor = (colorInput) => {
    if (!colorInput) return null;
    
    const normalizedColor = colorInput.trim().toLowerCase();
    return COLORS[normalizedColor] || 
           (normalizedColor.startsWith('#') ? 
            parseInt(normalizedColor.replace('#', ''), 16) : 
            null);
};

async function handleSayModal(interaction) {
    try {
        // Validate modal structure
        const parts = interaction.customId.split('-');
        if (parts.length < 2) {
            return interaction.reply({ 
                content: '❌ Invalid modal submission.',
                flags: 64 
            });
        }

        const channelId = parts[1];
        const channel = interaction.guild.channels.cache.get(channelId);

        // Validate channel existence
        if (!channel) {
            return interaction.reply({ 
                content: '❌ The target channel no longer exists.',
                flags: 64 
            });
        }

        // Check bot permissions
        const botMember = interaction.guild.members.me;
        if (!channel.permissionsFor(botMember).has(PermissionsBitField.Flags.SendMessages)) {
            return interaction.reply({
                content: '❌ I do not have permission to send messages in that channel!',
                flags: 64
            });
        }

        // Defer reply to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Extract modal inputs
        const title = interaction.fields.getTextInputValue('titleInput')?.trim() || null;
        const content = interaction.fields.getTextInputValue('messageInput')?.trim();
        const imageUrl = interaction.fields.getTextInputValue('imageInput')?.trim() || null;
        const colorInput = interaction.fields.getTextInputValue('colorInput')?.trim() || null;

        // Validate content
        if (!content) {
            return interaction.followUp({ 
                content: '❌ Message content is required.',
                flags: 64 
            });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setDescription(content)
            .setTimestamp()
            .setFooter({ text: 'Powered by DBR' });

        // Optional embed enhancements
        if (title) embed.setTitle(title);

        const embedColor = parseColor(colorInput);
        if (embedColor) embed.setColor(embedColor);

        // Validate and add image
        if (imageUrl && !imageUrl.startsWith('http')) {
            return interaction.followUp({ 
                content: '❌ Invalid image URL provided!',
                flags: 64 
            });
        }

        if (imageUrl) embed.setImage(imageUrl);
        // Send message
        await channel.send({ embeds: [embed] });

        // Confirm success
        await interaction.followUp({
            content: `✅ Message sent successfully to ${channel}!`,
            flags: 64
        });

    } catch (error) {
        console.error('[SAY MODAL] Processing error:', error);
        
        // Ensure a response is always sent
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An unexpected error occurred while processing your modal.',
                flags: 64
            });
        } else if (interaction.deferred) {
            await interaction.followUp({
                content: '❌ An unexpected error occurred while processing your modal.',
                flags: 64
            });
        }
    }
}

module.exports = { handleSayModal };