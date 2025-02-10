const { Events } = require('discord.js');
const { handleSayModal } = require('../handlers/ModalHandler'); 

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
                if (interaction.customId === 'whitelist_button') {
                    const whitelistModule = require('../features/whitelist');
                    await whitelistModule.handleButton(interaction);
                }
                return;
            }

            if (interaction.isStringSelectMenu() && interaction.customId.startsWith('whitelist_answer_')) {
                const whitelistModule = require('../features/whitelist');
                await whitelistModule.handleSelectMenu(interaction);
                return;
            }

            if (interaction.isModalSubmit() && interaction.customId.startsWith('sayModal-')) {
                await handleSayModal(interaction);
                return;
            }

            console.warn(`⚠️ Unhandled interaction type: ${interaction.type}`);

        } catch (error) {
            console.error('❌ Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ An error occurred while processing your interaction.', flags: 64 });
            }
        }
    }
};
