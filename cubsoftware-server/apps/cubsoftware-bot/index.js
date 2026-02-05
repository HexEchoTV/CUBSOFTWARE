const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const DiscordTerminal = require('../../shared/discord-terminal');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
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

function saveLinksFile(data) {
    try {
        fs.mkdirSync(path.dirname(LINKS_FILE), { recursive: true });
        fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving links file:', e);
        return false;
    }
}

function saveAuditFile(data) {
    try {
        fs.mkdirSync(path.dirname(LINKS_AUDIT_FILE), { recursive: true });
        fs.writeFileSync(LINKS_AUDIT_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving audit file:', e);
        return false;
    }
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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ============================================
// CubReactive Voice State Tracking
// ============================================

// Store voice states: { userId: { channelId, muted, deafened, speaking, ... } }
const voiceStates = new Map();
// Store connected overlay WebSockets: { userId: [ws1, ws2, ...] }
const overlayConnections = new Map();
// Store channel members: { channelId: Set(userId1, userId2, ...) }
const channelMembers = new Map();
// Track active voice connections: { channelId: VoiceConnection }
const activeVoiceConnections = new Map();
// Track which channels have overlay users: { channelId: Set(userId) }
const overlayChannels = new Map();

// CubReactive data file path
const CUBREACTIVE_USERS_FILE = path.join(__dirname, '..', 'cubsoftware-website', 'data', 'cubreactive_users.json');

function loadCubReactiveUsers() {
    try {
        if (fs.existsSync(CUBREACTIVE_USERS_FILE)) {
            return JSON.parse(fs.readFileSync(CUBREACTIVE_USERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading CubReactive users:', e);
    }
    return {};
}

// Broadcast voice state update to connected overlays
function broadcastVoiceUpdate(userId, data) {
    // Broadcast to individual overlays for this user
    const userConnections = overlayConnections.get(userId) || [];
    userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'VOICE_STATE_UPDATE', userId, data }));
        }
    });

    // Also broadcast to group overlays that include this user
    overlayConnections.forEach((connections, overlayUserId) => {
        if (overlayUserId !== userId) {
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN && ws.isGroupMode) {
                    // Check if they're in the same channel
                    const overlayUserState = voiceStates.get(overlayUserId);
                    const targetUserState = voiceStates.get(userId);
                    if (overlayUserState && targetUserState &&
                        overlayUserState.channelId === targetUserState.channelId) {
                        ws.send(JSON.stringify({ type: 'VOICE_STATE_UPDATE', userId, data }));
                    }
                }
            });
        }
    });
}

// Broadcast channel members update
function broadcastChannelUpdate(channelId) {
    const members = channelMembers.get(channelId) || new Set();
    const memberList = Array.from(members).map(userId => {
        const state = voiceStates.get(userId);
        return state ? { userId, ...state } : null;
    }).filter(Boolean);

    // Find all overlays that are tracking users in this channel
    overlayConnections.forEach((connections, userId) => {
        const userState = voiceStates.get(userId);
        if (userState && userState.channelId === channelId) {
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'CHANNEL_UPDATE', channelId, members: memberList }));
                }
            });
        }
    });
}

// ============================================
// Voice Connection Management (for speaking detection)
// ============================================

// Join a voice channel to detect speaking
async function joinChannelForSpeaking(channelId, guildId) {
    if (activeVoiceConnections.has(channelId)) return; // Already connected

    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`[CubReactive] Guild ${guildId} not found, skipping voice join`);
            return;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log(`[CubReactive] Channel ${channelId} not found, skipping voice join`);
            return;
        }

        // Check bot has permission to connect
        const permissions = channel.permissionsFor(guild.members.me);
        if (!permissions || !permissions.has('Connect')) {
            console.log(`[CubReactive] No Connect permission for channel: ${channel.name}`);
            return;
        }

        console.log(`[CubReactive] Joining voice channel: ${channel.name} (${channelId})`);

        const connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        activeVoiceConnections.set(channelId, connection);

        // Wait for ready state before setting up listeners
        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`[CubReactive] Voice connection ready in: ${channel.name}`);
        });

        // Listen for speaking events
        connection.receiver.speaking.on('start', (userId) => {
            const state = voiceStates.get(userId);
            if (state) {
                state.speaking = true;
                voiceStates.set(userId, state);
                broadcastVoiceUpdate(userId, state);
            }
        });

        connection.receiver.speaking.on('end', (userId) => {
            const state = voiceStates.get(userId);
            if (state) {
                state.speaking = false;
                voiceStates.set(userId, state);
                broadcastVoiceUpdate(userId, state);
            }
        });

        // Handle disconnection
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Reconnecting
            } catch (e) {
                // Truly disconnected
                try { connection.destroy(); } catch (_) {}
                activeVoiceConnections.delete(channelId);
                console.log(`[CubReactive] Disconnected from channel: ${channelId}`);
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            activeVoiceConnections.delete(channelId);
        });

        // Catch any errors on the connection
        connection.on('error', (err) => {
            console.error(`[CubReactive] Voice connection error in ${channelId}:`, err.message);
        });

    } catch (e) {
        console.error(`[CubReactive] Failed to join voice channel ${channelId}:`, e.message);
        activeVoiceConnections.delete(channelId);
    }
}

// Leave a voice channel when no more overlay users need it
function leaveChannelIfUnneeded(channelId) {
    const overlayUsers = overlayChannels.get(channelId);
    if (!overlayUsers || overlayUsers.size === 0) {
        overlayChannels.delete(channelId);
        const connection = activeVoiceConnections.get(channelId);
        if (connection) {
            console.log(`[CubReactive] Leaving voice channel: ${channelId} (no overlay users)`);
            connection.destroy();
            activeVoiceConnections.delete(channelId);
        }
    }
}

// Track overlay user in a channel (call when overlay subscribes and user is in voice)
function trackOverlayUser(userId, channelId, guildId) {
    if (!overlayChannels.has(channelId)) {
        overlayChannels.set(channelId, new Set());
    }
    overlayChannels.get(channelId).add(userId);
    joinChannelForSpeaking(channelId, guildId);
}

// Untrack overlay user from a channel
function untrackOverlayUser(userId, channelId) {
    const overlayUsers = overlayChannels.get(channelId);
    if (overlayUsers) {
        overlayUsers.delete(userId);
        leaveChannelIfUnneeded(channelId);
    }
}

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

// Feature management terminal command
terminal.addCommand('feature', {
    description: 'Enable/disable website features',
    usage: 'feature <enable|disable|list> [name]',
    execute: async (args) => {
        const action = args[0];
        const featureName = args.slice(1).join('-');

        const DISABLED_FILE = path.join(WEBSITE_DATA_PATH, 'disabled_features.json');

        function loadDisabled() {
            try {
                if (fs.existsSync(DISABLED_FILE)) {
                    return JSON.parse(fs.readFileSync(DISABLED_FILE, 'utf8'));
                }
            } catch (e) {}
            return [];
        }

        function saveDisabled(features) {
            try {
                fs.mkdirSync(path.dirname(DISABLED_FILE), { recursive: true });
                fs.writeFileSync(DISABLED_FILE, JSON.stringify(features, null, 2));
                return true;
            } catch (e) {
                return false;
            }
        }

        const allFeatures = [
            'social-media-saver', 'file-converter', 'pdf-tools', 'image-editor',
            'qr-generator', 'link-shortener', 'color-picker', 'text-tools',
            'unit-converter', 'json-formatter', 'timestamp-converter', 'video-compressor',
            'resume-builder', 'countdown-maker', 'random-picker', 'wheel-spinner',
            'calculator-suite', 'password-generator', 'timer-tools', 'world-clock',
            'currency-converter', 'sticky-board', 'encoding-tools', 'diff-checker',
            'regex-tester', 'code-minifier', 'markdown-editor', 'notepad',
            'invoice-generator', 'audio-trimmer'
        ];

        if (!action || !['enable', 'disable', 'list'].includes(action)) {
            return '❌ Usage: `>feature <enable|disable|list> [name]`\n\nAvailable features:\n`' + allFeatures.join('`, `') + '`';
        }

        if (action === 'list') {
            const disabled = loadDisabled();
            const list = allFeatures.map(f => {
                const status = disabled.includes(f) ? '🔴' : '🟢';
                return `${status} ${f}`;
            }).join('\n');
            return `**Feature Status:**\n${list}\n\n*${disabled.length} disabled, ${allFeatures.length - disabled.length} enabled*`;
        }

        if (!featureName) {
            return '❌ Please specify a feature name.\n\nAvailable: `' + allFeatures.join('`, `') + '`';
        }

        if (!allFeatures.includes(featureName)) {
            return `❌ Unknown feature: \`${featureName}\`\n\nAvailable: \`${allFeatures.join('`, `')}\``;
        }

        const disabled = loadDisabled();

        if (action === 'disable') {
            if (disabled.includes(featureName)) {
                return `⚠️ **${featureName}** is already disabled.`;
            }
            disabled.push(featureName);
            if (saveDisabled(disabled)) {
                return `🔴 **${featureName}** has been **disabled**.`;
            }
            return '❌ Failed to save.';
        }

        if (action === 'enable') {
            if (!disabled.includes(featureName)) {
                return `⚠️ **${featureName}** is not disabled.`;
            }
            const updated = disabled.filter(f => f !== featureName);
            if (saveDisabled(updated)) {
                return `🟢 **${featureName}** has been **enabled**.`;
            }
            return '❌ Failed to save.';
        }
    }
});

// Link management terminal commands
terminal.addCommand('link-find', {
    description: 'Find information about a shortened link',
    usage: 'link-find <code>',
    execute: async (args) => {
        let code = args[0];
        if (!code) {
            return '❌ Usage: `>link-find <code>`';
        }

        // Extract code from full URL if provided
        if (code.includes('cubsw.link/')) {
            code = code.split('cubsw.link/')[1].split(/[?#]/)[0];
        }
        if (code.includes('/')) {
            code = code.split('/').pop();
        }

        const links = loadLinksFile();
        const audit = loadAuditFile();

        if (links[code]) {
            const link = links[code];
            return `**Link Found (Active)**
• Code: \`${code}\`
• URL: ${link.url.substring(0, 200)}
• Clicks: ${link.clicks || 0}
• Created: ${new Date(link.created * 1000).toLocaleString()}
• IP: ||${link.ip || 'Unknown'}||`;
        }

        if (audit[code]) {
            const entry = audit[code];
            return `**Link Found (Deleted)**
• Code: \`${code}\`
• Original URL: ${entry.original_url.substring(0, 200)}
• Created: ${new Date(entry.created_at * 1000).toLocaleString()}
• IP: ||${entry.ip_address}||`;
        }

        return `❌ No link found with code: \`${code}\``;
    }
});

terminal.addCommand('link-delete', {
    description: 'Delete a shortened link',
    usage: 'link-delete <code>',
    execute: async (args) => {
        let code = args[0];
        if (!code) {
            return '❌ Usage: `>link-delete <code>`';
        }

        // Extract code from full URL if provided
        if (code.includes('cubsw.link/')) {
            code = code.split('cubsw.link/')[1].split(/[?#]/)[0];
        }
        if (code.includes('/')) {
            code = code.split('/').pop();
        }

        const links = loadLinksFile();
        const audit = loadAuditFile();

        if (!links[code]) {
            if (audit[code]) {
                return `⚠️ Link \`${code}\` was already deleted.`;
            }
            return `❌ No link found with code: \`${code}\``;
        }

        const linkData = links[code];

        // Save to audit log
        if (!audit[code]) {
            audit[code] = {
                original_url: linkData.url,
                created_at: linkData.created,
                ip_address: linkData.ip || 'Unknown',
                history: []
            };
        }

        audit[code].history = audit[code].history || [];
        audit[code].history.push({
            action: 'deleted',
            timestamp: Math.floor(Date.now() / 1000),
            ip: 'Discord Terminal',
            clicks: linkData.clicks || 0
        });

        // Delete the link
        delete links[code];

        const linksSaved = saveLinksFile(links);
        saveAuditFile(audit);

        if (linksSaved) {
            return `✅ **Link Deleted**
• Code: \`${code}\`
• URL: ${linkData.url.substring(0, 200)}
• Clicks: ${linkData.clicks || 0}`;
        } else {
            return '❌ Failed to delete link.';
        }
    }
});

terminal.addCommand('link-list', {
    description: 'List recent shortened links',
    usage: 'link-list [count]',
    execute: async (args) => {
        const count = Math.min(parseInt(args[0]) || 10, 25);
        const links = loadLinksFile();

        const sorted = Object.entries(links)
            .sort((a, b) => (b[1].created || 0) - (a[1].created || 0))
            .slice(0, count);

        if (sorted.length === 0) {
            return '📋 No links found.';
        }

        const list = sorted.map(([code, data]) => {
            const url = data.url.length > 40 ? data.url.substring(0, 40) + '...' : data.url;
            return `\`${code}\` → ${url} (${data.clicks || 0} clicks)`;
        }).join('\n');

        return `**Recent Links (${sorted.length})**\n${list}`;
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

    new SlashCommandBuilder()
        .setName('link-delete')
        .setDescription('Delete a shortened link')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The short code or full URL (e.g., abc123 or cubsw.link/abc123)')
                .setRequired(true)
        )
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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Feature management command
    new SlashCommandBuilder()
        .setName('feature')
        .setDescription('Enable or disable website features')
        .addSubcommand(sub => sub
            .setName('disable')
            .setDescription('Disable a feature')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Feature to disable')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Social Media Saver', value: 'social-media-saver' },
                        { name: 'File Converter', value: 'file-converter' },
                        { name: 'PDF Tools', value: 'pdf-tools' },
                        { name: 'Image Editor', value: 'image-editor' },
                        { name: 'QR Generator', value: 'qr-generator' },
                        { name: 'Link Shortener', value: 'link-shortener' },
                        { name: 'Color Picker', value: 'color-picker' },
                        { name: 'Text Tools', value: 'text-tools' },
                        { name: 'Unit Converter', value: 'unit-converter' },
                        { name: 'JSON Formatter', value: 'json-formatter' },
                        { name: 'Timestamp Converter', value: 'timestamp-converter' },
                        { name: 'Video Compressor', value: 'video-compressor' },
                        { name: 'Resume Builder', value: 'resume-builder' },
                        { name: 'Countdown Maker', value: 'countdown-maker' },
                        { name: 'Random Picker', value: 'random-picker' },
                        { name: 'Wheel Spinner', value: 'wheel-spinner' },
                        { name: 'Calculator Suite', value: 'calculator-suite' },
                        { name: 'Password Generator', value: 'password-generator' },
                        { name: 'Timer Tools', value: 'timer-tools' },
                        { name: 'World Clock', value: 'world-clock' },
                        { name: 'Currency Converter', value: 'currency-converter' },
                        { name: 'Sticky Board', value: 'sticky-board' }
                    )
            )
        )
        .addSubcommand(sub => sub
            .setName('enable')
            .setDescription('Enable a feature')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Feature to enable')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Social Media Saver', value: 'social-media-saver' },
                        { name: 'File Converter', value: 'file-converter' },
                        { name: 'PDF Tools', value: 'pdf-tools' },
                        { name: 'Image Editor', value: 'image-editor' },
                        { name: 'QR Generator', value: 'qr-generator' },
                        { name: 'Link Shortener', value: 'link-shortener' },
                        { name: 'Color Picker', value: 'color-picker' },
                        { name: 'Text Tools', value: 'text-tools' },
                        { name: 'Unit Converter', value: 'unit-converter' },
                        { name: 'JSON Formatter', value: 'json-formatter' },
                        { name: 'Timestamp Converter', value: 'timestamp-converter' },
                        { name: 'Video Compressor', value: 'video-compressor' },
                        { name: 'Resume Builder', value: 'resume-builder' },
                        { name: 'Countdown Maker', value: 'countdown-maker' },
                        { name: 'Random Picker', value: 'random-picker' },
                        { name: 'Wheel Spinner', value: 'wheel-spinner' },
                        { name: 'Calculator Suite', value: 'calculator-suite' },
                        { name: 'Password Generator', value: 'password-generator' },
                        { name: 'Timer Tools', value: 'timer-tools' },
                        { name: 'World Clock', value: 'world-clock' },
                        { name: 'Currency Converter', value: 'currency-converter' },
                        { name: 'Sticky Board', value: 'sticky-board' }
                    )
            )
        )
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('List all features and their status')
        )
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

    if (interaction.commandName === 'link-delete') {
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

        // Check if link exists
        if (!links[code]) {
            // Check if it was already deleted
            if (audit[code]) {
                return interaction.reply({ content: `⚠️ Link \`${code}\` was already deleted.`, ephemeral: true });
            }
            return interaction.reply({ content: `❌ No link found with code: \`${code}\``, ephemeral: true });
        }

        const linkData = links[code];

        // Save to audit log before deleting
        if (!audit[code]) {
            audit[code] = {
                original_url: linkData.url,
                created_at: linkData.created,
                ip_address: linkData.ip || 'Unknown',
                history: []
            };
        }

        audit[code].history = audit[code].history || [];
        audit[code].history.push({
            action: 'deleted',
            timestamp: Math.floor(Date.now() / 1000),
            ip: 'Discord Bot',
            deletedBy: interaction.user.id,
            clicks: linkData.clicks || 0
        });

        // Delete the link
        delete links[code];

        // Save both files
        const linksSaved = saveLinksFile(links);
        const auditSaved = saveAuditFile(audit);

        if (linksSaved) {
            const embed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('Link Deleted')
                .addFields(
                    { name: 'Short Code', value: code, inline: true },
                    { name: 'Clicks', value: String(linkData.clicks || 0), inline: true },
                    { name: 'Original URL', value: linkData.url.substring(0, 500), inline: false },
                    { name: 'Creator IP', value: `||${linkData.ip || 'Unknown'}||`, inline: true },
                    { name: 'Deleted By', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setTimestamp();

            // Log to links channel
            try {
                const linksChannel = await client.channels.fetch(config.linksLogChannelId).catch(() => null);
                if (linksChannel) {
                    await linksChannel.send({
                        content: `🗑️ Link deleted by <@${interaction.user.id}>`,
                        embeds: [embed]
                    });
                }
            } catch (e) {
                console.error('Failed to log link deletion:', e);
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            return interaction.reply({ content: '❌ Failed to delete link.', ephemeral: true });
        }
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

    // Feature management command
    if (interaction.commandName === 'feature') {
        if (!isOwner) {
            return interaction.reply({ content: '❌ This command is restricted to bot owners.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const featureName = interaction.options.getString('name');

        // Load disabled features from file
        const DISABLED_FILE = path.join(WEBSITE_DATA_PATH, 'disabled_features.json');

        function loadDisabledFeatures() {
            try {
                if (fs.existsSync(DISABLED_FILE)) {
                    return JSON.parse(fs.readFileSync(DISABLED_FILE, 'utf8'));
                }
            } catch (e) {
                console.error('Error loading disabled features:', e);
            }
            return [];
        }

        function saveDisabledFeatures(features) {
            try {
                fs.mkdirSync(path.dirname(DISABLED_FILE), { recursive: true });
                fs.writeFileSync(DISABLED_FILE, JSON.stringify(features, null, 2));
                return true;
            } catch (e) {
                console.error('Error saving disabled features:', e);
                return false;
            }
        }

        if (sub === 'disable') {
            const disabled = loadDisabledFeatures();

            if (disabled.includes(featureName)) {
                return interaction.reply({ content: `⚠️ **${featureName}** is already disabled.`, ephemeral: true });
            }

            disabled.push(featureName);

            if (saveDisabledFeatures(disabled)) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF6B6B)
                    .setTitle('Feature Disabled')
                    .setDescription(`**${featureName}** has been disabled.`)
                    .addFields({ name: 'Status', value: '🔴 Disabled', inline: true })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ Failed to disable feature.', ephemeral: true });
            }
        }

        if (sub === 'enable') {
            const disabled = loadDisabledFeatures();

            if (!disabled.includes(featureName)) {
                return interaction.reply({ content: `⚠️ **${featureName}** is not disabled.`, ephemeral: true });
            }

            const updated = disabled.filter(f => f !== featureName);

            if (saveDisabledFeatures(updated)) {
                const embed = new EmbedBuilder()
                    .setColor(0x22c55e)
                    .setTitle('Feature Enabled')
                    .setDescription(`**${featureName}** has been enabled.`)
                    .addFields({ name: 'Status', value: '🟢 Enabled', inline: true })
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                return interaction.reply({ content: '❌ Failed to enable feature.', ephemeral: true });
            }
        }

        if (sub === 'list') {
            const disabled = loadDisabledFeatures();

            const allFeatures = [
                'social-media-saver', 'file-converter', 'pdf-tools', 'image-editor',
                'qr-generator', 'link-shortener', 'color-picker', 'text-tools',
                'unit-converter', 'json-formatter', 'timestamp-converter', 'video-compressor',
                'resume-builder', 'countdown-maker', 'random-picker', 'wheel-spinner',
                'calculator-suite', 'password-generator', 'timer-tools', 'world-clock',
                'currency-converter', 'sticky-board'
            ];

            const featureList = allFeatures.map(f => {
                const status = disabled.includes(f) ? '🔴' : '🟢';
                return `${status} ${f}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle('Feature Status')
                .setDescription(featureList)
                .setFooter({ text: `${disabled.length} disabled, ${allFeatures.length - disabled.length} enabled` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands.map(c => c.toJSON()) });
    console.log('Commands registered');
}

// ============================================
// Voice State Update Handler
// ============================================
client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    // Ignore bot's own voice state changes
    if (userId === client.user.id) return;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;
    const guildId = newState.guild?.id || oldState.guild?.id;

    // Get user info
    const member = newState.member || oldState.member;
    const username = member?.displayName || member?.user?.username || 'Unknown';
    const avatar = member?.user?.avatarURL({ size: 256 }) ||
                   `https://cdn.discordapp.com/embed/avatars/${parseInt(member?.user?.discriminator || '0') % 5}.png`;

    // Case 1: User left voice completely
    if (!newChannelId) {
        if (oldChannelId) {
            const oldMembers = channelMembers.get(oldChannelId);
            if (oldMembers) {
                oldMembers.delete(userId);
                if (oldMembers.size === 0) channelMembers.delete(oldChannelId);
            }
            if (overlayConnections.has(userId)) {
                untrackOverlayUser(userId, oldChannelId);
            }
            broadcastChannelUpdate(oldChannelId);
        }
        voiceStates.delete(userId);
        broadcastVoiceUpdate(userId, { left: true });
        return;
    }

    // Case 2: User switched channels
    if (oldChannelId && oldChannelId !== newChannelId) {
        const oldMembers = channelMembers.get(oldChannelId);
        if (oldMembers) {
            oldMembers.delete(userId);
            if (oldMembers.size === 0) channelMembers.delete(oldChannelId);
        }
        if (overlayConnections.has(userId)) {
            untrackOverlayUser(userId, oldChannelId);
        }
        broadcastChannelUpdate(oldChannelId);
    }

    // Case 3: User joined or is in a channel — update state
    if (!channelMembers.has(newChannelId)) {
        channelMembers.set(newChannelId, new Set());
    }
    channelMembers.get(newChannelId).add(userId);

    const isNewJoin = !oldChannelId || oldChannelId !== newChannelId;

    // Build/update voice state
    const state = {
        channelId: newChannelId,
        guildId: guildId,
        username,
        avatar,
        muted: newState.selfMute || newState.serverMute || false,
        deafened: newState.selfDeaf || newState.serverDeaf || false,
        speaking: voiceStates.get(userId)?.speaking || false,
        streaming: newState.streaming || false,
        video: newState.selfVideo || false
    };

    voiceStates.set(userId, state);
    broadcastVoiceUpdate(userId, state);

    // Only send channel update and join voice on actual channel change
    if (isNewJoin) {
        if (overlayConnections.has(userId)) {
            trackOverlayUser(userId, newChannelId, guildId);
        }
        broadcastChannelUpdate(newChannelId);
    }
});

// ============================================
// CubReactive WebSocket Server
// ============================================
const CUBREACTIVE_WS_PORT = process.env.CUBREACTIVE_WS_PORT || 3848;
let wss = null;

function startCubReactiveWebSocket() {
    wss = new WebSocket.Server({ port: CUBREACTIVE_WS_PORT });

    wss.on('connection', (ws, req) => {
        console.log('[CubReactive] New WebSocket connection');

        ws.isAlive = true;
        ws.userId = null;
        ws.isGroupMode = false;

        ws.on('pong', () => { ws.isAlive = true; });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'SUBSCRIBE') {
                    // Check if user has CubReactive enabled
                    const cubUsers = loadCubReactiveUsers();
                    const userConfig = cubUsers[data.userId];
                    if (userConfig && userConfig.enabled === false) {
                        ws.send(JSON.stringify({ type: 'DISABLED', userId: data.userId }));
                        ws.close();
                        return;
                    }

                    // Subscribe to voice updates for a user
                    ws.userId = data.userId;
                    ws.isGroupMode = data.mode === 'group';

                    // Add to connections map
                    if (!overlayConnections.has(data.userId)) {
                        overlayConnections.set(data.userId, []);
                    }
                    overlayConnections.get(data.userId).push(ws);

                    console.log(`[CubReactive] Subscribed: ${data.userId} (${data.mode || 'individual'})`);

                    // Send current state if user is in voice
                    const currentState = voiceStates.get(data.userId);
                    if (currentState) {
                        ws.send(JSON.stringify({ type: 'VOICE_STATE_UPDATE', userId: data.userId, data: currentState }));

                        // Join the voice channel for speaking detection
                        if (currentState.channelId && currentState.guildId) {
                            trackOverlayUser(data.userId, currentState.channelId, currentState.guildId);
                        }

                        // If group mode, send all channel members
                        if (ws.isGroupMode && currentState.channelId) {
                            broadcastChannelUpdate(currentState.channelId);
                        }
                    } else {
                        // User not in voice
                        ws.send(JSON.stringify({ type: 'NOT_IN_VOICE', userId: data.userId }));
                    }
                }

                if (data.type === 'PING') {
                    ws.send(JSON.stringify({ type: 'PONG' }));
                }

            } catch (e) {
                console.error('[CubReactive] Message parse error:', e);
            }
        });

        ws.on('close', () => {
            // Remove from connections
            if (ws.userId) {
                const connections = overlayConnections.get(ws.userId);
                if (connections) {
                    const index = connections.indexOf(ws);
                    if (index > -1) {
                        connections.splice(index, 1);
                    }
                    if (connections.length === 0) {
                        overlayConnections.delete(ws.userId);

                        // No more overlays for this user - leave voice if we joined for them
                        const userState = voiceStates.get(ws.userId);
                        if (userState && userState.channelId) {
                            untrackOverlayUser(ws.userId, userState.channelId);
                        }
                    }
                }
            }
            console.log('[CubReactive] WebSocket disconnected');
        });

        // Send ready message
        ws.send(JSON.stringify({ type: 'READY' }));
    });

    // Heartbeat to detect dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    console.log(`[CubReactive] WebSocket server running on port ${CUBREACTIVE_WS_PORT}`);
}

client.once('ready', () => {
    console.log(`[CubSoftware Bot] Online as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'cubsoftware.site', type: 3 }], status: 'online' });
    terminal.init();
    registerCommands();
    startLogServer();
    startCubReactiveWebSocket();
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

// Catch unhandled errors so voice connection issues don't crash the bot
process.on('unhandledRejection', (err) => {
    console.error('[CubSoftware Bot] Unhandled rejection:', err.message || err);
});

client.login(config.token);
