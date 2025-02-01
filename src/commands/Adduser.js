const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adduser')
        .setDescription('Adds a user to the ticket channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add')
                .setRequired(true)
        ),

    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        const channel = interaction.channel;

        if (!['support-', 'frp-'].some(prefix => channel.name.startsWith(prefix))) {
            return interaction.reply({ content: 'This can only be used in ticket channels', flags: 64 });
        }

        try {
            await channel.permissionOverwrites.create(user.id, {
                ViewChannel: true,
                SendMessages: true,
            });
            return interaction.reply({ content: `Successfully added ${user} to the ticket channel.` });
        } catch (error) {
            return interaction.reply({ content: 'An error occurred while adding the user.', flags: 64 });
        }
    }
};
