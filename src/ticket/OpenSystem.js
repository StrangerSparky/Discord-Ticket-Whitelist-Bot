// File: OpenTicket.js
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, Colors, ChannelType, PermissionFlagsBits
} = require("discord.js");

// Configurations
const TICKET_CATEGORIES = {
  support: {
    name: "SUPPORT",
    emoji: "⚙️",
    categoryId: process.env.SUPPORT_CATEGORY_ID,
    channelName: (username) => `support-${username}`
  },
  nitro: {
    name: "FRP",
    emoji: "❌",
    categoryId: process.env.FRP_CATEGORY_ID,
    channelName: (username) => `frp-${username}`
  }
};

class OpenTicket {
  static async handleTicketOpen(interaction) {
    try {
      // Check existing tickets using user ID from topic
      const existingTicket = interaction.guild.channels.cache.find(channel => 
        channel.name.includes(interaction.user.username.toLowerCase()) && 
        (channel.name.startsWith('support-') || channel.name.startsWith('frp-'))
      );

      if (existingTicket) {
        return interaction.reply({
          content: `❌ You already have an open ticket! Please use ${existingTicket}`,
          flags: 64
        });
      }

      // Show category selection
      const selector = new StringSelectMenuBuilder()
        .setCustomId('ticket_category')
        .setPlaceholder('Select ticket category')
        .addOptions(Object.entries(TICKET_CATEGORIES).map(([id, config]) => ({
          label: config.name,
          value: id,
          emoji: config.emoji
        })));

      await interaction.reply({
        content: "Choose a ticket category:",
        components: [new ActionRowBuilder().addComponents(selector)],
        flags: 64
      });
    } catch (error) {
      console.error('Ticket open error:', error);
      interaction.reply({ content: "❌ Failed to create ticket", flags: 64 });
    }
  }

  static async handleTicketCreate(interaction) {
    try {
      const category = interaction.customId.split('-')[1];
      const reason = interaction.fields.getTextInputValue('reason');
      const config = TICKET_CATEGORIES[category];

      // Create ticket channel
      const channel = await interaction.guild.channels.create({
        name: config.channelName(interaction.user.username),
        type: ChannelType.GuildText,
        parent: config.categoryId,
        topic: `Ticket for ${interaction.user.tag} (${interaction.user.id})`,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });

      // Send initial message
      const closeButton = new ButtonBuilder()
        .setCustomId('close')
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const embed = new EmbedBuilder()
        .setTitle(`${config.emoji} ${config.name} Ticket`)
        .setDescription(`**Created by:** ${interaction.user}\n**Reason:** ${reason}`)
        .setColor(0xF228FE);

      await channel.send({
        content: `<@&${process.env.SUPPORT_ROLE}>`,
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(closeButton)]
      });

      await interaction.reply({
        content: `✅ Ticket created: ${channel}`,
        flags: 64
      });
    } catch (error) {
      console.error('Ticket creation error:', error);
      interaction.reply({ content: "❌ Failed to create ticket", flags: 64 });
    }
  }

  static async handleCategorySelect(interaction) {
    try {
      const category = interaction.values[0];
      const modal = new ModalBuilder()
        .setCustomId(`ticket_reason-${category}`)
        .setTitle('Ticket Reason');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Why are you creating this ticket?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      await interaction.showModal(modal);
    } catch (error) {
      interaction.reply({ content: "❌ Failed to show reason form", flags: 64 });
    }
  }
}

module.exports = OpenTicket;