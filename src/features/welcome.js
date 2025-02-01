const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage,} = require('canvas');
const { AttachmentBuilder } = require('discord.js');
require('dotenv').config();

module.exports = async (client) => {
    client.on('guildMemberAdd', async (member) => {
        // Add member role
        try {
            const memberRole = member.guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
            if (memberRole) {
                await member.roles.add(memberRole);
                console.log(`Added member role to ${member.user.tag}`);
            } else {
                console.error('Member role not found');
            }
        } catch (error) {
            console.error('Error adding member role:', error);
        }

        const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome' || ch.id === process.env.WELCOME_CHANNEL_ID);
        console.log('Channel:', channel);
        if (!channel) {
            console.error('Welcome channel not found!');
            return;
        }
        
        try {
            console.log('Loading background image...');
            const backgroundPath = path.resolve(__dirname, '../../assets/banner.jpg');
            
            // Verify background image exists if it's a local file
            if (!fs.existsSync(backgroundPath)) {
                throw new Error('Background image file not found');
            }

            // Read and process background image with sharp first
            const backgroundBuffer = await sharp(fs.readFileSync(backgroundPath))
                .resize(700, 250)
                .png() // Convert to PNG format
                .toBuffer();
            
            console.log('Background image processed successfully!');

            // Process avatar
            const avatarUrl = member.user.displayAvatarURL({ format: 'png', size: 128 });
            console.log('Fetching avatar from:', avatarUrl);
            
            const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            const avatarBuffer = await sharp(avatarResponse.data)
                .resize(128, 128)
                .png() // Convert to PNG format
                .toBuffer();
            
            console.log('Avatar processed successfully!');

            // Create canvas and load processed images
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            // Load processed images
            const background = await loadImage(backgroundBuffer);
            const avatar = await loadImage(avatarBuffer);

            // Draw background
            ctx.drawImage(background, 0, 0, 700, 250);

            // Draw avatar in circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 125, 50, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 50, 75, 100, 100);
            ctx.restore();

            // Send the welcome message
            await channel.send({
                content: `Welcome to DBR PVP ${member.user}`,
                files: [{ 
                    attachment: canvas.toBuffer('image/png'),
                    name: 'welcome-image.png'
                }]
            });
            const gifAttachment = new AttachmentBuilder('./assets/line.gif'); 
            await channel.send({ files: [gifAttachment] });

            console.log('Welcome image sent successfully!');

        } catch (error) {
            console.error('Error generating welcome image:', error);
            // Log more detailed error information
            if (error.response) {
                console.error('Response error data:', error.response.data);
                console.error('Response error status:', error.response.status);
            }
            channel.send(`Welcome to the server, ${member.user.username}! (Error: ${error.message})`);
        }
    });
};