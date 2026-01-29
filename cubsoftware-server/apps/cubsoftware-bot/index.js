const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const DiscordTerminal = require('../../shared/discord-terminal');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    apiUrl: process.env.API_URL || 'https://cubsoftware.site',
    apiKey: process.env.API_KEY,
    ownerIds: (process.env.OWNER_IDS || '378501056008683530').split(',').map(id => id.trim()),
    terminalChannelId: process.env.TERMINAL_CHANNEL_ID || '1466190584372003092',
    logServerPort: process.env.LOG_SERVER_PORT || 3847
};

// Channel IDs for each project's logs
const projectChannels = {
    'cubsoftware-website': '1466190584372003092',
    'questcord-website': '1466190431485427856'
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const terminal = new DiscordTerminal(client, {
    prefix: '>',
    ownerIds: config.ownerIds,
    channelId: config.terminalChannelId,
    botName: 'CubSoftware Bot & Website'
});

// Custom command: whitelist management
terminal.addCommand('whitelist', {
    description: 'Manage dashboard whitelist',
    usage: 'whitelist <add|remove|list> [id]',
    execute: async (args) => {
        const action = args[0];
        const userId = args[1];

        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return '❌ Usage: `>whitelist <add|remove|list> [userid]`';
        }

        const headers = { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' };

        if (action === 'list') {
            const res = await axios.get(`${config.apiUrl}/api/pm2/bot/whitelist`, { headers });
            const users = res.data.allowed_users || [];
            return `📋 **Whitelist:**\n\`\`\`\n${users.join('\n') || 'None'}\n\`\`\``;
        }

        if (!userId) return '❌ Provide a user ID';

        if (action === 'add') {
            await axios.post(`${config.apiUrl}/api/pm2/bot/whitelist/add`, { user_id: userId }, { headers });
            return `✅ Added **${userId}**`;
        }

        if (action === 'remove') {
            await axios.post(`${config.apiUrl}/api/pm2/bot/whitelist/remove`, { user_id: userId }, { headers });
            return `🗑️ Removed **${userId}**`;
        }
    }
});

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('cubsoftware')
        .setDescription('CUB SOFTWARE information')
        .addSubcommand(sub => sub.setName('info').setDescription('About CUB SOFTWARE'))
        .addSubcommand(sub => sub.setName('apps').setDescription('List all apps'))
];

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'cubsoftware') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'info') {
            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle('CUB SOFTWARE')
                .setDescription('Free, privacy-focused web tools.')
                .addFields(
                    { name: 'Website', value: '[cubsoftware.site](https://cubsoftware.site)', inline: true },
                    { name: 'QuestCord', value: '[questcord.fun](https://questcord.fun)', inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === 'apps') {
            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle('CUB SOFTWARE Apps')
                .addFields(
                    { name: 'Social Media Saver', value: 'Download content', inline: true },
                    { name: 'File Converter', value: 'Convert images', inline: true },
                    { name: 'PDF Tools', value: 'Merge/split PDFs', inline: true },
                    { name: 'QR Generator', value: 'Create QR codes', inline: true },
                    { name: 'More...', value: 'cubsoftware.site', inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
    }
});

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands.map(c => c.toJSON()) });
    console.log('Commands registered');
}

client.once('ready', () => {
    console.log(`[CubSoftware Bot] Online as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'cubsoftware.site', type: 3 }], status: 'online' });
    terminal.init();
    registerCommands();
    startLogServer();
});

// HTTP server for receiving logs from websites
function startLogServer() {
    const app = express();
    app.use(express.json());

    // Log endpoint - websites can POST logs here
    app.post('/log', async (req, res) => {
        const { project, level, message, apiKey } = req.body;

        // Verify API key
        if (apiKey !== config.apiKey) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (!project || !message) {
            return res.status(400).json({ error: 'Missing project or message' });
        }

        const channelId = projectChannels[project];
        if (!channelId) {
            return res.status(400).json({ error: 'Unknown project' });
        }

        try {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                return res.status(500).json({ error: 'Channel not found' });
            }

            const colors = {
                info: 0x3b82f6,
                success: 0x22c55e,
                warn: 0xf59e0b,
                error: 0xef4444
            };

            const icons = {
                info: 'ℹ️',
                success: '✅',
                warn: '⚠️',
                error: '❌'
            };

            const logLevel = level || 'info';
            const embed = new EmbedBuilder()
                .setColor(colors[logLevel] || colors.info)
                .setDescription(`${icons[logLevel] || ''} ${message}`)
                .setFooter({ text: project })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            res.json({ success: true });
        } catch (err) {
            console.error('Log server error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(config.logServerPort, '127.0.0.1', () => {
        console.log(`[CubSoftware Bot] Log server running on port ${config.logServerPort}`);
    });
}

client.login(config.token);
