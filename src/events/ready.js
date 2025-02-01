const { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            const channel = client.channels.cache.get(process.env.TICKET_CHANNEL_ID);
            if (!channel) return;

            await channel.messages.fetch().then(messages => {
                if (messages.size > 0) {
                    channel.bulkDelete(messages);
                }
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('Support Ticket System')
                .setDescription('Click the button below to create a ticket')
                .setColor(0xF228FE)
                .setTimestamp()
                .setFooter({ text: 'Support System' });

            const button = new ButtonBuilder()
                .setCustomId('ticket')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');

            const row = new ActionRowBuilder().addComponents(button);

            await channel.send({
                embeds: [ticketEmbed],
                components: [row]
            });

            const warningEmbed = new EmbedBuilder()
                .setColor(0xF228FE)
                .setDescription('> **Note: Please do not create tickets unnecessarily. Abuse of the ticket system may result in moderation action.**');

            await channel.send({ embeds: [warningEmbed] });

            console.log('✅ Ticket system initialized');
        } catch (error) {
            console.error('❌ Error setting up ticket system:', error);
        }
    }
}; 