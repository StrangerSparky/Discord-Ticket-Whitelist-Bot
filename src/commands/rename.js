const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Renames the current ticket')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('New name for the ticket')
                .setRequired(true)
        ),

    execute: async (interaction) => {
        const channel = interaction.channel;
        const newName = interaction.options.getString('name');

        if (!['support-', 'frp-'].some(prefix => channel.name.startsWith(prefix))) {
            return interaction.reply({ content: 'This can only be used in ticket channels', flags: 64 });
        }

        try {
            await channel.setName(newName);
            return interaction.reply({ content: `Channel renamed to: ${newName}` });
        } catch (error) {
            return interaction.reply({ content: 'Failed to rename the channel.', flags: 64 });
        }
    }
}; 