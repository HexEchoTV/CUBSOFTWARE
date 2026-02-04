const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DiscordTerminal = require('../../shared/discord-terminal');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    apiUrl: process.env.API_URL || 'https://cubsoftware.site',
    apiKey: process.env.API_KEY,
    adminApiKey: process.env.ADMIN_API_KEY,
    ownerIds: (process.env.OWNER_IDS || '378501056008683530').split(',').map(id => id.trim()),
    terminalChannelId: process.env.TERMINAL_CHANNEL_ID || '1466190584372003092',
    linksLogChannelId: process.env.LINKS_LOG_CHANNEL_ID || '1466190584372003092',
    logServerPort: process.env.LOG_SERVER_PORT || 3847
};

// Channel IDs for each project's logs
const projectChannels = {
    'cubsoftware-website': '1466190584372003092',
    'questcord-website': '1466190431485427856',
    'cleanme-bot': '1466190746401902855',
    'links': config.linksLogChannelId,
    'reports': '1468610071494656226'
};

// Path to website data files (for direct file access)
const WEBSITE_DATA_PATH = path.join(__dirname, '..', 'cubsoftware-website', 'data');
const LINKS_FILE = path.join(WEBSITE_DATA_PATH, 'shortened_links.json');
const LINKS_AUDIT_FILE = path.join(WEBSITE_DATA_PATH, 'links_audit.json');
const BANNED_IPS_FILE = path.join(WEBSITE_DATA_PATH, 'banned_ips.json');

// Helper functions for link management
function loadLinksFile() {
    try {
        if (fs.existsSync(LINKS_FILE)) {
            return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading links file:', e);
    }
    return {};
}

function loadAuditFile() {
    try {
        if (fs.existsSync(LINKS_AUDIT_FILE)) {
            return JSON.parse(fs.readFileSync(LINKS_AUDIT_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading audit file:', e);
    }
    return {};
}

function loadBannedIps() {
    try {
        if (fs.existsSync(BANNED_IPS_FILE)) {
            return JSON.parse(fs.readFileSync(BANNED_IPS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading banned IPs:', e);
    }
    return { ips: [], reasons: {} };
}

function saveBannedIps(data) {
    try {
        fs.mkdirSync(path.dirname(BANNED_IPS_FILE), { recursive: true });
        fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving banned IPs:', e);
        return false;
    }
}

// Comprehensive IP ban management
const IP_BANS_FILE = path.join(WEBSITE_DATA_PATH, 'ip_bans.json');

function loadIpBans() {
    try {
        if (fs.existsSync(IP_BANS_FILE)) {
            return JSON.parse(fs.readFileSync(IP_BANS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading IP bans:', e);
    }
    return { global: [], features: {}, temp: [] };
}

function saveIpBans(data) {
    try {
        fs.mkdirSync(path.dirname(IP_BANS_FILE), { recursive: true });
        fs.writeFileSync(IP_BANS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving IP bans:', e);
        return false;
    }
}

// Parse duration string (e.g., "1h", "30m", "7d") to milliseconds
function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] || 0);
}

// Format milliseconds to readable duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

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
        .addSubcommand(sub => sub.setName('apps').setDescription('List all apps')),

    new SlashCommandBuilder()
        .setName('link-find')
        .setDescription('Find information about a shortened link')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The short code or full URL (e.g., abc123 or cubsw.link/abc123)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('link-ban')
        .setDescription('Ban an IP from creating links')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP address to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('link-unban')
        .setDescription('Unban an IP from creating links')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP address to unban')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('link-bans')
        .setDescription('List all banned IPs')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Comprehensive IP ban commands
    new SlashCommandBuilder()
        .setName('ip-ban')
        .setDescription('Ban an IP from the website')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP address to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Ban type')
                .setRequired(true)
                .addChoices(
                    { name: 'Global (entire website)', value: 'global' },
                    { name: 'Link Shortener', value: 'links' },
                    { name: 'Social Media Saver', value: 'social' },
                    { name: 'File Converter', value: 'converter' },
                    { name: 'PDF Tools', value: 'pdf' },
                    { name: 'Reports', value: 'reports' }
                )
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('ip-temp-ban')
        .setDescription('Temporarily ban an IP')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP address to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 30m, 1h, 7d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Ban type (default: global)')
                .setRequired(false)
                .addChoices(
                    { name: 'Global (entire website)', value: 'global' },
                    { name: 'Link Shortener', value: 'links' },
                    { name: 'Social Media Saver', value: 'social' }
                )
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('ip-unban')
        .setDescription('Unban an IP')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP address to unban')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('ip-list')
        .setDescription('List all IP bans')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Check if user is owner for admin commands
    const isOwner = config.ownerIds.includes(interaction.user.id);

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

    // Link management commands (owner only)
    if (interaction.commandName === 'link-find') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        let code = interaction.options.getString('code');

        // Extract code from full URL if provided
        if (code.includes('cubsw.link/')) {
            code = code.split('cubsw.link/')[1].split(/[?#]/)[0];
        }
        if (code.includes('/')) {
            code = code.split('/').pop();
        }

        // Load link data
        const links = loadLinksFile();
        const audit = loadAuditFile();

        // Check active links first
        if (links[code]) {
            const link = links[code];
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Link Found (Active)')
                .addFields(
                    { name: 'Short Code', value: code, inline: true },
                    { name: 'Status', value: '🟢 Active', inline: true },
                    { name: 'Clicks', value: String(link.clicks || 0), inline: true },
                    { name: 'Destination', value: link.url.substring(0, 500), inline: false },
                    { name: 'Created', value: new Date(link.created * 1000).toLocaleString(), inline: true },
                    { name: 'Creator IP', value: `||${link.ip || 'Unknown'}||`, inline: true }
                )
                .setTimestamp();

            // Add audit history if available
            if (audit[code] && audit[code].history) {
                const historyText = audit[code].history.slice(-5).map(h =>
                    `${h.action} - ${new Date(h.timestamp * 1000).toLocaleString()}`
                ).join('\n');
                embed.addFields({ name: 'History (last 5)', value: historyText || 'None', inline: false });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check audit log for deleted links
        if (audit[code]) {
            const auditEntry = audit[code];
            const embed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('Link Found (Deleted)')
                .addFields(
                    { name: 'Short Code', value: code, inline: true },
                    { name: 'Status', value: '🔴 Deleted', inline: true },
                    { name: 'Original URL', value: auditEntry.original_url.substring(0, 500), inline: false },
                    { name: 'Created', value: new Date(auditEntry.created_at * 1000).toLocaleString(), inline: true },
                    { name: 'Creator IP', value: `||${auditEntry.ip_address}||`, inline: true }
                )
                .setTimestamp();

            if (auditEntry.history) {
                const historyText = auditEntry.history.map(h =>
                    `${h.action} - ${new Date(h.timestamp * 1000).toLocaleString()} - ||${h.ip}||`
                ).join('\n');
                embed.addFields({ name: 'Full History', value: historyText || 'None', inline: false });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        return interaction.reply({ content: `❌ No link found with code: \`${code}\``, ephemeral: true });
    }

    if (interaction.commandName === 'link-ban') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const banned = loadBannedIps();
        if (banned.ips.includes(ip)) {
            return interaction.reply({ content: `⚠️ IP \`${ip}\` is already banned.`, ephemeral: true });
        }

        banned.ips.push(ip);
        banned.reasons[ip] = {
            reason: reason,
            bannedBy: interaction.user.id,
            bannedAt: Date.now()
        };

        if (saveBannedIps(banned)) {
            return interaction.reply({ content: `✅ Banned IP: \`${ip}\`\nReason: ${reason}`, ephemeral: true });
        } else {
            return interaction.reply({ content: '❌ Failed to save ban.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'link-unban') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');

        const banned = loadBannedIps();
        if (!banned.ips.includes(ip)) {
            return interaction.reply({ content: `⚠️ IP \`${ip}\` is not banned.`, ephemeral: true });
        }

        banned.ips = banned.ips.filter(i => i !== ip);
        delete banned.reasons[ip];

        if (saveBannedIps(banned)) {
            return interaction.reply({ content: `✅ Unbanned IP: \`${ip}\``, ephemeral: true });
        } else {
            return interaction.reply({ content: '❌ Failed to save unban.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'link-bans') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const banned = loadBannedIps();

        if (banned.ips.length === 0) {
            return interaction.reply({ content: '📋 No IPs are currently banned.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('Banned IPs')
            .setDescription(banned.ips.map(ip => {
                const info = banned.reasons[ip];
                if (info) {
                    return `\`${ip}\` - ${info.reason} (${new Date(info.bannedAt).toLocaleDateString()})`;
                }
                return `\`${ip}\``;
            }).join('\n'))
            .setFooter({ text: `Total: ${banned.ips.length} banned IPs` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Comprehensive IP ban commands
    if (interaction.commandName === 'ip-ban') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');
        const type = interaction.options.getString('type');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const bans = loadIpBans();

        if (type === 'global') {
            // Check if already banned
            if (bans.global.some(b => b.ip === ip)) {
                return interaction.reply({ content: `⚠️ IP \`${ip}\` is already globally banned.`, ephemeral: true });
            }
            bans.global.push({
                ip,
                reason,
                bannedBy: interaction.user.id,
                bannedAt: Date.now()
            });
        } else {
            // Feature-specific ban
            if (!bans.features[type]) {
                bans.features[type] = [];
            }
            if (bans.features[type].some(b => b.ip === ip)) {
                return interaction.reply({ content: `⚠️ IP \`${ip}\` is already banned from ${type}.`, ephemeral: true });
            }
            bans.features[type].push({
                ip,
                reason,
                bannedBy: interaction.user.id,
                bannedAt: Date.now()
            });
        }

        if (saveIpBans(bans)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('IP Banned')
                .addFields(
                    { name: 'IP Address', value: `\`${ip}\``, inline: true },
                    { name: 'Type', value: type === 'global' ? 'Global (entire website)' : type, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            return interaction.reply({ content: '❌ Failed to save ban.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'ip-temp-ban') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');
        const durationStr = interaction.options.getString('duration');
        const type = interaction.options.getString('type') || 'global';
        const reason = interaction.options.getString('reason') || 'Temporary ban';

        const duration = parseDuration(durationStr);
        if (!duration) {
            return interaction.reply({ content: '❌ Invalid duration format. Use: 30m, 1h, 7d, etc.', ephemeral: true });
        }

        const bans = loadIpBans();
        const expires = Date.now() + duration;

        // Remove any existing temp ban for this IP
        bans.temp = bans.temp.filter(b => b.ip !== ip);

        bans.temp.push({
            ip,
            feature: type === 'global' ? null : type,
            reason,
            bannedBy: interaction.user.id,
            bannedAt: Date.now(),
            expires
        });

        if (saveIpBans(bans)) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('IP Temporarily Banned')
                .addFields(
                    { name: 'IP Address', value: `\`${ip}\``, inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Type', value: type === 'global' ? 'Global' : type, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(expires / 1000)}:R>`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            return interaction.reply({ content: '❌ Failed to save temp ban.', ephemeral: true });
        }
    }

    if (interaction.commandName === 'ip-unban') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const ip = interaction.options.getString('ip');
        const bans = loadIpBans();
        let removed = false;

        // Remove from global bans
        const globalIndex = bans.global.findIndex(b => b.ip === ip);
        if (globalIndex !== -1) {
            bans.global.splice(globalIndex, 1);
            removed = true;
        }

        // Remove from feature bans
        for (const feature in bans.features) {
            const index = bans.features[feature].findIndex(b => b.ip === ip);
            if (index !== -1) {
                bans.features[feature].splice(index, 1);
                removed = true;
            }
        }

        // Remove from temp bans
        const tempIndex = bans.temp.findIndex(b => b.ip === ip);
        if (tempIndex !== -1) {
            bans.temp.splice(tempIndex, 1);
            removed = true;
        }

        if (removed) {
            if (saveIpBans(bans)) {
                return interaction.reply({ content: `✅ Unbanned IP: \`${ip}\``, ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ Failed to save unban.', ephemeral: true });
            }
        } else {
            return interaction.reply({ content: `⚠️ IP \`${ip}\` was not found in any ban list.`, ephemeral: true });
        }
    }

    if (interaction.commandName === 'ip-list') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const bans = loadIpBans();
        const embed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('All IP Bans')
            .setTimestamp();

        // Global bans
        if (bans.global.length > 0) {
            embed.addFields({
                name: `🌐 Global Bans (${bans.global.length})`,
                value: bans.global.slice(0, 10).map(b =>
                    `\`${b.ip}\` - ${b.reason}`
                ).join('\n') + (bans.global.length > 10 ? `\n... and ${bans.global.length - 10} more` : ''),
                inline: false
            });
        }

        // Feature bans
        for (const feature in bans.features) {
            if (bans.features[feature].length > 0) {
                embed.addFields({
                    name: `📌 ${feature} (${bans.features[feature].length})`,
                    value: bans.features[feature].slice(0, 5).map(b =>
                        `\`${b.ip}\` - ${b.reason}`
                    ).join('\n') + (bans.features[feature].length > 5 ? `\n... and ${bans.features[feature].length - 5} more` : ''),
                    inline: false
                });
            }
        }

        // Temp bans
        const activeTempBans = bans.temp.filter(b => b.expires > Date.now());
        if (activeTempBans.length > 0) {
            embed.addFields({
                name: `⏰ Temporary Bans (${activeTempBans.length})`,
                value: activeTempBans.slice(0, 10).map(b =>
                    `\`${b.ip}\` - ${b.feature || 'global'} - expires <t:${Math.floor(b.expires / 1000)}:R>`
                ).join('\n'),
                inline: false
            });
        }

        const totalBans = bans.global.length +
            Object.values(bans.features).reduce((sum, arr) => sum + arr.length, 0) +
            activeTempBans.length;

        if (totalBans === 0) {
            embed.setDescription('No IPs are currently banned.');
        } else {
            embed.setFooter({ text: `Total: ${totalBans} active bans` });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
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

    // Report endpoint - for user-submitted reports
    app.post('/report', async (req, res) => {
        const { apiKey, report } = req.body;

        // Verify API key
        if (apiKey !== config.apiKey) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (!report) {
            return res.status(400).json({ error: 'Missing report data' });
        }

        const channelId = projectChannels['reports'];
        if (!channelId) {
            return res.status(400).json({ error: 'Reports channel not configured' });
        }

        try {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel) {
                return res.status(500).json({ error: 'Channel not found' });
            }

            // Main report embed
            const reportEmbed = new EmbedBuilder()
                .setTitle(`New Report: ${(report.type || 'general').charAt(0).toUpperCase() + (report.type || 'general').slice(1)}`)
                .setColor(0xFF6B6B)
                .addFields(
                    { name: 'Report ID', value: report.id || 'N/A', inline: true },
                    { name: 'Type', value: report.type || 'general', inline: true },
                    { name: 'Subject', value: report.subject || 'N/A', inline: false },
                    { name: 'Description', value: (report.description || 'N/A').substring(0, 1000), inline: false },
                    { name: 'URL', value: report.url || 'N/A', inline: false },
                    { name: 'Contact', value: report.contact || 'N/A', inline: true }
                )
                .setTimestamp();

            // Tracking info embed
            const trackingEmbed = new EmbedBuilder()
                .setTitle('User Tracking Information')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'IP Address', value: `\`${report.ip || 'Unknown'}\``, inline: true },
                    { name: 'Fingerprint', value: `\`${report.fingerprint || 'N/A'}\``, inline: true },
                    { name: 'User Agent', value: `\`\`\`${(report.user_agent || 'Unknown').substring(0, 200)}\`\`\``, inline: false },
                    { name: 'Language', value: report.accept_language || 'Unknown', inline: true },
                    { name: 'Referer', value: (report.referer || 'Direct').substring(0, 100), inline: true }
                );

            // Send with admin ping
            await channel.send({
                content: `<@378501056008683530> New report submitted!`,
                embeds: [reportEmbed, trackingEmbed]
            });

            res.json({ success: true });
        } catch (err) {
            console.error('Report server error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(config.logServerPort, '127.0.0.1', () => {
        console.log(`[CubSoftware Bot] Log server running on port ${config.logServerPort}`);
    });
}

client.login(config.token);
