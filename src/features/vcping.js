const { EmbedBuilder } = require('discord.js');
const COLORS = require('../utils/colors'); // Import COLORS from colors.js
require('dotenv').config();

function setupVCPing(client) {
    const userJoinTimes = new Map();
    const messageCache = new Map(); // Store the message ID for each user
    const logChannelId = process.env.VC_LOG_CHANNEL;
    const targetVCId = process.env.TARGET_VC_ID;  // Define the VC you want to track

    if (!logChannelId || !targetVCId) {
        console.error('❌ VC_LOG_CHANNEL or TARGET_VC_ID environment variable is not set!');
        return;
    }

    client.on('voiceStateUpdate', async (oldState, newState) => {
        console.log(`Voice state updated for user: ${newState.member.user.tag}`);
        console.log(`Old channel: ${oldState.channel ? oldState.channel.name : 'None'}`);
        console.log(`New channel: ${newState.channel ? newState.channel.name : 'None'}`);

        try {
            const logChannel = client.channels.cache.get(logChannelId);
            if (!logChannel) {
                console.error('❌ Log channel not found!');
                return;
            }

            const member = newState.member || oldState.member;
            if (!member) {
                console.error('❌ Member not found in voice state update!');
                return;
            }

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

            // User joined the specific voice channel
            if (!oldState.channel && newState.channel && newState.channel.id === targetVCId) {
                userJoinTimes.set(member.id, new Date());

                const embed = new EmbedBuilder()
                    .setColor(COLORS.green)
                    .setTitle('🎤 Voice Channel Activity')
                    .setDescription(`**${member.user.displayName}** joined **${newState.channel.name}** at ${time}`)
                    .setTimestamp()
                    .setFooter({ text: 'Powered by DBR' });

                // Send the embed and store the message ID in the cache
                const joinMessage = await logChannel.send({ embeds: [embed] });
                messageCache.set(member.id, joinMessage.id); // Store the message ID
            }

            // User moved from one channel to another (including the target VC)
            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                const joinTime = userJoinTimes.get(member.id);
                const joinMessageId = messageCache.get(member.id);  // Get the join message ID from the cache

                if (joinTime) {
                    const moveTime = new Date();
                    const sessionDuration = new Date(moveTime - joinTime).toISOString().substr(11, 8); // Format the duration as HH:MM:SS
                    userJoinTimes.delete(member.id);

                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('🔄 Voice Channel Activity')
                        .setDescription(`**${member.user.displayName}** left **${oldState.channel.name}** at ${time} (Duration: ${sessionDuration})`)
                        .setTimestamp()
                        .setFooter({ text: 'Powered by DBR' });

                    // Edit the join message to show the move details with duration
                    const joinMessage = await logChannel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('🔄 Voice Channel Activity')
                        .setDescription(`**${member.user.displayName}** left **${oldState.channel.name}** at ${time}`)
                        .setTimestamp()
                        .setFooter({ text: 'Powered by DBR' });

                    // Edit the join message to show the move details without duration
                    const joinMessage = await logChannel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ embeds: [embed] });
                }

                // Optionally, remove the message ID from the cache after editing
                messageCache.delete(member.id);
            }

            // User left from the moved channel (without moving to another VC)
            if (oldState.channel && !newState.channel && oldState.channel.id === targetVCId) {
                const joinTime = userJoinTimes.get(member.id);
                const joinMessageId = messageCache.get(member.id);  // Get the join message ID from the cache

                if (joinTime) {
                    const leaveTime = new Date();
                    const sessionDuration = new Date(leaveTime - joinTime).toISOString().substr(11, 8); // Format the duration as HH:MM:SS
                    userJoinTimes.delete(member.id);

                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('🔒 Voice Channel Activity')
                        .setDescription(`**${member.user.displayName}** left **${oldState.channel.name}** at ${time} (Duration: ${sessionDuration})`)
                        .setTimestamp()
                        .setFooter({ text: 'Powered by DBR' });

                    // Edit the join message to show the leave details with duration
                    const joinMessage = await logChannel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('🔒 Voice Channel Activity')
                        .setDescription(`**${member.user.displayName}** left **${oldState.channel.name}** at ${time}`)
                        .setTimestamp()
                        .setFooter({ text: 'Powered by DBR' });

                    // Edit the join message to show the leave details without duration
                    const joinMessage = await logChannel.messages.fetch(joinMessageId);
                    await joinMessage.edit({ embeds: [embed] });
                }

                // Optionally, remove the message ID from the cache after editing
                messageCache.delete(member.id);
            }

        } catch (error) {
            console.error('❌ Error in voiceStateUpdate event:', error);
        }
    });
}

module.exports = setupVCPing;
