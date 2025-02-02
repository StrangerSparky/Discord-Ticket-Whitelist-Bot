const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require("discord.js");
const transcript = require("discord-html-transcripts");
const fs = require("fs/promises");
const path = require("path");

module.exports = {
    async handleCloseRequest(interaction) {
        // Check if user has permission to close tickets
        const hasPermission = interaction.member.roles.cache.has(process.env.SUPPORT_ROLE) || 
                            interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.reply({
                content: "❌ You don't have permission to close tickets.",
                flags: 64
            });
        }

        try {
            const reasonInput = new TextInputBuilder()
                .setCustomId("ticket_close_reason")
                .setLabel("Reason for Closing Ticket")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Please provide a reason for closing this ticket")
                .setRequired(true)
                .setMaxLength(500);

            const modal = new ModalBuilder()
                .setCustomId("ticket_close_reason_modal")
                .setTitle("Ticket Close Reason")
                .addComponents(new ActionRowBuilder().addComponents(reasonInput));

            await interaction.showModal(modal);
        } catch (error) {
            await interaction.reply({
                content: "❌ Failed to show close reason form",
                flags: 64,
            });
        }
    },

    async handleCloseReasonSubmit(interaction) {
        try {
            const reason = interaction.fields.getTextInputValue("ticket_close_reason");
            const confirmRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("yes")
                    .setLabel("Confirm Close")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("no")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.reply({
                content: `Are you sure you want to close this ticket?\n\n**Reason:** ${reason}`,
                components: [confirmRow],
                flags: 64
            });
        } catch (error) {
            await interaction.reply({
                content: "Failed to process ticket closure",
                flags: 64
            });
        }
    },

    async handleConfirmClose(interaction, client) {
        await interaction.deferUpdate();
        const channel = interaction.channel;
        let reason = "No specific reason provided";

        try {
            if (interaction.message?.content) {
                const reasonMatch = interaction.message.content.match(/\*\*Reason:\*\* (.+)/);
                if (reasonMatch) reason = reasonMatch[1];
            }

            const channelNameParts = channel.name.split("-");
            const ownerName = channelNameParts[1];
            if (!ownerName) return;

            const ticketOwner = client.users.cache.find(
                (user) => user.username === ownerName || user.tag === ownerName
            );
            if (!ticketOwner) return;

            await this.closeTicketWithReason(interaction, channel, ticketOwner, reason);
        } catch (error) {}
    },

    async closeTicketWithReason(interaction, channel, ticketOwner, reason) {
        try {
            const [allMessages, transcriptBuffer] = await Promise.all([
                channel.messages.fetch(),
                transcript.createTranscript(channel, {
                    filename: `transcript-${channel.name}.html`,
                    saveImages: true,
                    poweredBy: false,
                    footerText: `Exported {number} messages • ${channel.name}`,
                    returnType: "buffer",
                }),
            ]);

            const activeUsers = new Set();
            allMessages.forEach((message) => {
                if (!message.author.bot) activeUsers.add(message.author);
            });

            const transcriptDir = path.join(process.cwd(), "transcripts");
            await fs.mkdir(transcriptDir, { recursive: true });
            await fs.writeFile(
                path.join(transcriptDir, `ticket-${channel.name}-transcript.html`),
                transcriptBuffer
            );

            const logChannel = await interaction.client.channels.fetch(process.env.TICKET_LOGS);
            if (logChannel) {
                const transcriptButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("📎 View Transcript")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`http://localhost:3000/transcripts/ticket-${channel.name}-transcript.html`)
                );
                
                await logChannel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle("📑 Ticket Closed")
                        .addFields(
                            { name: "Ticket Owner", value: ticketOwner.username || "Unknown", inline: true },
                            { name: "\u200B", value: "\u200B", inline: true },
                            { name: "Ticket Name", value: channel.name, inline: true },
                            { name: "Reason", value: reason || "No reason provided", inline: false }
                        )
                        .setColor(0xF228FE)
                        .setTimestamp()
                    ],
                    components: [transcriptButton],
                });
            }

            await channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("🔒 Ticket Closed")
                    .setDescription(`This ticket has been closed by ${interaction.user}. Reason: ${reason}`)
                    .setColor(Colors.Red)
                ],
            });

            if (ticketOwner) {
                try {
                    await ticketOwner.send({
                        embeds: [new EmbedBuilder()
                            .setColor(0xF228FE)
                            .setTitle("🔒 Ticket Closed")
                            .setDescription(`<@${ticketOwner.id}> Your ticket has been closed by <@${interaction.user.id}>`)
                            .addFields(
                                { name: "Closure Time", value: new Date().toLocaleString(), inline: true },
                                { name: "Ticket Name", value: channel.name, inline: true },
                                { name: "Reason", value: reason }
                            )
                            .setImage("https://i.ibb.co/q8QqGGd/promo.gif")
                            .setTimestamp()
                            .setFooter({ text: "Powered By DBR" })
                        ]
                    });
                } catch (error) {}
            }

            await channel.delete();
        } catch (error) {
            await this.handleTranscriptError(channel, error);
        }
    },

    async handleTranscriptError(channel, error) {
        try {
            await channel.send({
                embeds: [new EmbedBuilder()
                    .setTitle("📛 Transcript Generation Failed")
                    .setDescription([
                        "**An error occurred while generating the transcript:**",
                        `\`${error.message}\``,
                        "",
                        "Please try closing the ticket again in a few minutes.",
                        "",
                        "If the issue persists, please contact the server administrators.",
                    ].join("\n"))
                    .setColor(Colors.Red)
                    .setTimestamp()
                ],
            });
        } catch (error) {}
    },
};