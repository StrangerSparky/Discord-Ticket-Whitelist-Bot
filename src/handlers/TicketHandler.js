// File: src/handlers/TicketHandler.js
const OpenTicket = require('../ticket/OpenSystem');
const CloseTicket = require('../ticket/CloseSystem');

module.exports = {
  event: "interactionCreate",
  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        if (interaction.customId === 'ticket') {
          await OpenTicket.handleTicketOpen(interaction);
        }
        if (interaction.customId === 'close') {
          await CloseTicket.handleCloseRequest(interaction);
        }
        if (interaction.customId === 'yes') {
          await CloseTicket.handleConfirmClose(interaction, interaction.client);
        }
        if (interaction.customId === 'no') {
          await interaction.update({ content: 'Ticket closure cancelled.', components: [], flags: 64 });
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_reason-')) {
          await OpenTicket.handleTicketCreate(interaction);
        }
        if (interaction.customId === 'ticket_close_reason_modal') {
          await CloseTicket.handleCloseReasonSubmit(interaction);
        }
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
        await OpenTicket.handleCategorySelect(interaction);
      }
    } catch (error) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: "An error occurred while processing your request.", 
          flags: 64 
        });
      }
    }
  }
};