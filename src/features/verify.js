const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const DB_PATH = path.join(__dirname, '../../database.json');

const LOG_CHANNEL_ID = '1334468047976534087';
const VERIFY_CHANNEL_ID = '1335850163306233856';

async function verify(client) {
  // Listen for the verification completion
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'verify_button') {
      await handleVerifyButton(interaction);
    }
  });
}

async function sendVerifyButton(client) {
  try {
    const verifyChannel = client.channels.cache.get(VERIFY_CHANNEL_ID);
    if (!verifyChannel) {
      console.error(`❌ Verification channel not found: ${VERIFY_CHANNEL_ID}`);
      return;
    }

    const authURL = 'http://localhost:3001';
    const authButton = new ButtonBuilder()
      .setLabel('Verify Now')
      .setStyle(ButtonStyle.Link)
      .setURL(authURL);

    const row = new ActionRowBuilder().addComponents(authButton);

    const embed = new EmbedBuilder()
      .setTitle('Verification Required')
      .setDescription('Click the button below to complete your verification.')
      .setColor(0x00ff44) // Discord blurple color
      .setFooter({ text: 'Secure verification process' });

    await verifyChannel.send({
      embeds: [embed],
      components: [row],
    });

    console.log('✅ Verification message sent successfully!');
  } catch (error) {
    console.error('❌ Error sending verification message:', error);
  }
}

async function handleVerifyButton(interaction) {
  try {
    if (interaction.replied || interaction.deferred) return;

    const authURL = 'http://localhost:3001';
    const authButton = new ButtonBuilder()
      .setLabel('Complete Verification')
      .setStyle(ButtonStyle.Link)
      .setURL(authURL);

    const row = new ActionRowBuilder().addComponents(authButton);

    const embed = new EmbedBuilder()
      .setTitle('Verification Required')
      .setDescription('Click the button below to complete your verification.')
      .setColor(0x5865F2) // Discord blurple color
      .setFooter({ text: 'Secure verification process' });

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
    });
  } catch (error) {
    console.error('Error handling verify button:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'An error occurred. Please try again later.',
        flags: 64,
      });
    }
  }
} 

async function storeUserData(client, userData) {
  try {
    let db = {};
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(data);
    }

    const userInfo = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      email: userData.email,
      avatar: userData.avatar,
      verified: true,
      verifiedAt: new Date().toISOString(),
      whitelisted: false,
    };

    db[userData.id] = userInfo;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    // Assign Member role after verification
    const GUILD_ID = 'YOUR_GUILD_ID'; // Replace with your server's ID
    const MEMBER_ROLE_ID = 'YOUR_ROLE_ID'; // Replace with the Member role ID

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      console.error('Guild not found.');
      return;
    }

    const member = await guild.members.fetch(userData.id);
    if (!member) {
      console.error('Member not found.');
      return;
    }

    await member.roles.add(MEMBER_ROLE_ID);
    console.log(`✅ Assigned 'Member' role to ${userData.username}`);

    return userInfo;
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
}

module.exports = {
  verify,
  storeUserData,
  handleVerifyButton,
  sendVerifyButton
};
