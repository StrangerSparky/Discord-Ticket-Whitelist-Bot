const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildExpressions ,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const handlersPath = path.join(__dirname, 'handlers');
const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    const handler = require(filePath);
    if (handler.event) {
        client.on(handler.event, (...args) => handler.execute(...args));
    }
}

const prefix = '!';

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Load whitelist command
    const whitelistCommand = require('./features/whitelist.js');
    
    if (commandName === 'whitelist') {
        try {
            await whitelistCommand.execute(message);
        } catch (error) {
            console.error('Error executing whitelist command:', error);
            message.reply('There was an error executing that command.');
        }
    }
});

client.on('interactionCreate', async interaction => {
    const whitelistCommand = require('./features/whitelist.js');

    try {
        if (interaction.isButton() && interaction.customId === 'whitelist_button') {
            await whitelistCommand.handleButton(interaction);
        }
        
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('whitelist_answer_')) {
            await whitelistCommand.handleSelectMenu(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

const welcome = require('./features/welcome');
const setupVCPing = require('./features/vcping');

welcome(client);
setupVCPing(client);

client.login(process.env.TOKEN); 