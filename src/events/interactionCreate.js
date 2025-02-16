const { Events } = require('discord.js');
const OpenTicket = require('../ticket/OpenSystem');
const CloseTicket = require('../ticket/CloseSystem');
const { handleSayModal } = require('../handlers/ModalHandler');
const whitelistModule = require('../features/whitelist');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(`❌ Error executing command ${interaction.commandName}:`, error);
                    await interaction.reply({ content: '❌ An error occurred while executing this command.', flags: 64 });
                }
                return;
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'ticket') {
                    await OpenTicket.handleTicketOpen(interaction);
                } else if (interaction.customId === 'close') {
                    await CloseTicket.handleCloseRequest(interaction);
                } else if (interaction.customId === 'yes') {
                    await CloseTicket.handleConfirmClose(interaction, interaction.client);
                } else if (interaction.customId === 'no') {
                    await interaction.update({ content: 'Ticket closure cancelled.', components: [], flags: 64 });
                } else if (interaction.customId === 'whitelist_button') {
                    await whitelistModule.handleButton(interaction);
                }
                return;
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('ticket_reason-')) {
                    await OpenTicket.handleTicketCreate(interaction);
                } else if (interaction.customId === 'ticket_close_reason_modal') {
                    await CloseTicket.handleCloseReasonSubmit(interaction);
                } else if (interaction.customId.startsWith('sayModal-')) {
                    await handleSayModal(interaction);
                }
                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_category') {
                    await OpenTicket.handleCategorySelect(interaction);
                } else if (interaction.customId.startsWith('whitelist_answer_')) {
                    await whitelistModule.handleSelectMenu(interaction);
                }
                return;
            }

            console.warn(`⚠️ Unhandled interaction type: ${interaction.type}`);
        } catch (error) {
            console.error('❌ Error handling interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while processing your interaction.', flags: 64 });
            }
        }
    }
};
