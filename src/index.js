const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping
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

// Centralized event loading with deduplication
const loadEvents = (client) => {
    const eventsPath = path.join(__dirname, 'events');
    const handlersPath = path.join(__dirname, 'handlers');
    const loadedEvents = new Set();

    // Load events from events folder
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.name && !loadedEvents.has(event.name)) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            loadedEvents.add(event.name);
            console.log(`[Event Loaded] ${event.name}`);
        }
    }

    // Load handlers from handlers folder
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
    for (const file of handlerFiles) {
        const filePath = path.join(handlersPath, file);
        const handler = require(filePath);
        if (handler.event && !loadedEvents.has(handler.event)) {
            client.on(handler.event, (...args) => handler.execute(...args));
            loadedEvents.add(handler.event);
            console.log(`[Handler Loaded] ${handler.event}`);
        }
    }
};

// Load events
loadEvents(client);


// Initialize OAuth and other features
require('./oauth/server.js');
require('../server.js');
require('./database.js');
require('./features/welcome')(client);
require('./features/vcping')(client);
require('./features/verify');
require('./features/whitelist.js');

client.login(process.env.TOKEN);