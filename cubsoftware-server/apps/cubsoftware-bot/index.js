const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Configuration
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    apiUrl: process.env.API_URL || 'https://cubsoftware.site',
    apiKey: process.env.API_KEY,
    ownerIds: (process.env.OWNER_IDS || '378501056008683530').split(',').map(id => id.trim())
};

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage PM2 Dashboard whitelist')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all whitelisted users'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('addid')
                .setDescription('Add a user by ID to the whitelist')
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('The Discord user ID to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeid')
                .setDescription('Remove a user by ID from the whitelist')
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('The Discord user ID to remove')
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('pm2')
        .setDescription('PM2 process management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show PM2 process status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restart')
                .setDescription('Restart a PM2 process')
                .addStringOption(option =>
                    option.setName('process')
                        .setDescription('Process name to restart')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop a PM2 process')
                .addStringOption(option =>
                    option.setName('process')
                        .setDescription('Process name to stop')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a PM2 process')
                .addStringOption(option =>
                    option.setName('process')
                        .setDescription('Process name to start')
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('cubsoftware')
        .setDescription('Information about CUB SOFTWARE')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show information about CUB SOFTWARE'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('apps')
                .setDescription('List all CUB SOFTWARE apps'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('Get link to PM2 Dashboard'))
];

// Check if user is owner
function isOwner(userId) {
    return config.ownerIds.includes(userId);
}

// API helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const response = await axios({
            method,
            url: `${config.apiUrl}${endpoint}`,
            headers: {
                'X-API-Key': config.apiKey,
                'Content-Type': 'application/json'
            },
            data
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
}

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'whitelist') {
            // Only owners can manage whitelist
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({
                    content: '❌ Only bot owners can manage the whitelist.',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const user = interaction.options.getUser('user');
                await interaction.deferReply({ ephemeral: true });

                const result = await apiRequest('/api/pm2/bot/whitelist/add', 'POST', {
                    user_id: user.id,
                    username: user.username
                });

                const embed = new EmbedBuilder()
                    .setColor(0x22c55e)
                    .setTitle('✅ User Added to Whitelist')
                    .setDescription(`**${user.username}** (${user.id}) has been added to the PM2 Dashboard whitelist.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'addid') {
                const userId = interaction.options.getString('userid');
                await interaction.deferReply({ ephemeral: true });

                if (!/^\d{17,19}$/.test(userId)) {
                    return interaction.editReply({ content: '❌ Invalid Discord User ID format.' });
                }

                const result = await apiRequest('/api/pm2/bot/whitelist/add', 'POST', {
                    user_id: userId,
                    username: 'Unknown'
                });

                const embed = new EmbedBuilder()
                    .setColor(0x22c55e)
                    .setTitle('✅ User Added to Whitelist')
                    .setDescription(`User ID **${userId}** has been added to the PM2 Dashboard whitelist.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'remove') {
                const user = interaction.options.getUser('user');
                await interaction.deferReply({ ephemeral: true });

                const result = await apiRequest('/api/pm2/bot/whitelist/remove', 'POST', {
                    user_id: user.id
                });

                const embed = new EmbedBuilder()
                    .setColor(0xef4444)
                    .setTitle('🗑️ User Removed from Whitelist')
                    .setDescription(`**${user.username}** (${user.id}) has been removed from the PM2 Dashboard whitelist.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'removeid') {
                const userId = interaction.options.getString('userid');
                await interaction.deferReply({ ephemeral: true });

                const result = await apiRequest('/api/pm2/bot/whitelist/remove', 'POST', {
                    user_id: userId
                });

                const embed = new EmbedBuilder()
                    .setColor(0xef4444)
                    .setTitle('🗑️ User Removed from Whitelist')
                    .setDescription(`User ID **${userId}** has been removed from the PM2 Dashboard whitelist.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'list') {
                await interaction.deferReply({ ephemeral: true });

                const result = await apiRequest('/api/pm2/bot/whitelist');
                const users = result.allowed_users || [];

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📋 PM2 Dashboard Whitelist')
                    .setDescription(users.length > 0
                        ? users.map((id, i) => `${i + 1}. \`${id}\``).join('\n')
                        : 'No users in whitelist.')
                    .setFooter({ text: `${users.length} user(s) whitelisted` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        }

        if (commandName === 'pm2') {
            // Only owners can manage PM2
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({
                    content: '❌ Only bot owners can manage PM2 processes.',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'status') {
                await interaction.deferReply();

                const result = await apiRequest('/api/pm2/processes');
                const processes = result.processes || [];

                const statusEmoji = {
                    'online': '🟢',
                    'stopped': '🔴',
                    'errored': '🟠'
                };

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📊 PM2 Process Status')
                    .setDescription(processes.length > 0
                        ? processes.map(p => {
                            const emoji = statusEmoji[p.status] || '⚪';
                            const cpu = (p.cpu || 0).toFixed(1);
                            const mem = formatBytes(p.memory || 0);
                            return `${emoji} **${p.name}** - CPU: ${cpu}% | RAM: ${mem}`;
                        }).join('\n')
                        : 'No processes found.')
                    .setFooter({ text: `${processes.filter(p => p.status === 'online').length}/${processes.length} online` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'restart' || subcommand === 'stop' || subcommand === 'start') {
                const processName = interaction.options.getString('process');
                await interaction.deferReply();

                const endpoint = `/api/pm2/${subcommand}/${processName}`;
                const result = await apiRequest(endpoint, 'POST');

                const actionPast = subcommand === 'restart' ? 'restarted' : (subcommand === 'stop' ? 'stopped' : 'started');
                const emoji = subcommand === 'restart' ? '🔄' : (subcommand === 'stop' ? '🛑' : '▶️');

                const embed = new EmbedBuilder()
                    .setColor(0x22c55e)
                    .setTitle(`${emoji} Process ${actionPast.charAt(0).toUpperCase() + actionPast.slice(1)}`)
                    .setDescription(`**${processName}** has been ${actionPast} successfully.`)
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        }

        if (commandName === 'cubsoftware') {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'info') {
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('🚀 CUB SOFTWARE')
                    .setDescription('CUB SOFTWARE is a collection of free, privacy-focused web tools and applications.')
                    .addFields(
                        { name: '🌐 Website', value: '[cubsoftware.site](https://cubsoftware.site)', inline: true },
                        { name: '🎮 QuestCord', value: '[questcord.fun](https://questcord.fun)', inline: true },
                        { name: '🔗 Short Links', value: '[cubsw.link](https://cubsw.link)', inline: true }
                    )
                    .setFooter({ text: 'Made with ❤️ by CUB' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'apps') {
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📱 CUB SOFTWARE Apps')
                    .setDescription('All our free web tools:')
                    .addFields(
                        { name: '🔐 CubVault', value: 'Password Manager', inline: true },
                        { name: '🎨 Color Picker', value: 'Color Tools', inline: true },
                        { name: '📱 QR Generator', value: 'QR Code Creator', inline: true },
                        { name: '📝 Text Tools', value: 'Text Utilities', inline: true },
                        { name: '🖼️ Image Editor', value: 'Image Editing', inline: true },
                        { name: '🔄 File Converter', value: 'Format Conversion', inline: true },
                        { name: '📄 PDF Tools', value: 'PDF Utilities', inline: true },
                        { name: '📏 Unit Converter', value: 'Unit Conversion', inline: true },
                        { name: '⏰ Countdown Maker', value: 'Timer Creator', inline: true },
                        { name: '🔗 Link Shortener', value: 'URL Shortening', inline: true },
                        { name: '📹 Video Compressor', value: 'Video Tools', inline: true },
                        { name: '📋 JSON Formatter', value: 'JSON Tools', inline: true }
                    )
                    .setFooter({ text: 'Visit cubsoftware.site for all tools' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'dashboard') {
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📊 PM2 Dashboard')
                    .setDescription('Monitor and manage server processes in real-time.')
                    .addFields(
                        { name: '🔗 Link', value: '[cubsoftware.site/apps/pm2-dashboard](https://cubsoftware.site/apps/pm2-dashboard)' },
                        { name: '🔒 Access', value: 'Requires Discord authentication and whitelist approval.' }
                    )
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

    } catch (error) {
        console.error('Command error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred';

        if (interaction.deferred) {
            return interaction.editReply({ content: `❌ Error: ${errorMessage}` });
        } else {
            return interaction.reply({ content: `❌ Error: ${errorMessage}`, ephemeral: true });
        }
    }
});

// Helper function
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Register slash commands
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands.map(cmd => cmd.toJSON()) }
        );

        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Ready event
client.once('ready', () => {
    console.log('='.repeat(50));
    console.log('         CUB SOFTWARE Bot');
    console.log('='.repeat(50));
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);
    console.log('='.repeat(50));

    // Set bot status
    client.user.setPresence({
        activities: [{ name: 'cubsoftware.site', type: 3 }], // Watching
        status: 'online'
    });

    // Register commands on startup
    registerCommands();
});

// Login
if (!config.token) {
    console.error('ERROR: DISCORD_TOKEN not set in .env file');
    process.exit(1);
}

client.login(config.token);
