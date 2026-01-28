const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const DiscordTerminal = require('../../shared/discord-terminal');

const terminalConfig = {
    ownerIds: (process.env.OWNER_IDS || '378501056008683530').split(',').map(id => id.trim()),
    terminalChannelId: process.env.TERMINAL_CHANNEL_ID || '1466190746401902855'
};

let terminal = null;

// Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all CleanMe bot commands and how to use them'),

    new SlashCommandBuilder()
        .setName('save')
        .setDescription('Save your current server configuration (roles, channels, categories)'),

    new SlashCommandBuilder()
        .setName('list')
        .setDescription('Check if your server has a saved configuration'),

    new SlashCommandBuilder()
        .setName('copy')
        .setDescription('Copy another server\'s saved configuration to your server')
        .addStringOption(option =>
            option.setName('serverid')
                .setDescription('The server ID to copy the configuration from')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Delete ALL channels and roles from your server'),

    new SlashCommandBuilder()
        .setName('cleanroles')
        .setDescription('Delete all roles from your server'),

    new SlashCommandBuilder()
        .setName('cleanchannels')
        .setDescription('Delete all channels and categories from your server'),
].map(command => command.toJSON());

// Deploy commands function
async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Deploying ${commands.length} slash commands globally...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully deployed ${data.length} slash commands!`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// Data storage path
const DATA_DIR = path.join(__dirname, 'data');
const SAVES_FILE = path.join(DATA_DIR, 'server-saves.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize saves
function loadSaves() {
    if (fs.existsSync(SAVES_FILE)) {
        return JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8'));
    }
    return {};
}

function saveSaves(data) {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(data, null, 2));
}

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Store pending confirmations
const pendingConfirmations = new Collection();

// Rich presence rotation
const presenceMessages = [
    { text: '/help - View all commands', type: ActivityType.Playing },
    { text: '/save - Backup your server', type: ActivityType.Playing },
    { text: '/copy - Clone a server setup', type: ActivityType.Playing },
    { text: '/clean - Wipe server clean', type: ActivityType.Playing },
    { text: '/list - Check saved configs', type: ActivityType.Playing },
    { text: '/cleanroles - Remove all roles', type: ActivityType.Playing },
    { text: '/cleanchannels - Remove all channels', type: ActivityType.Playing },
];

let presenceIndex = 0;

function updatePresence() {
    const presence = presenceMessages[presenceIndex];
    client.user.setActivity(presence.text, { type: presence.type });
    console.log(`[Presence] Updated to: ${presence.text}`);
    presenceIndex = (presenceIndex + 1) % presenceMessages.length;
}

client.once('ready', async () => {
    console.log(`CleanMe Bot is online! Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} servers`);

    // Initialize terminal
    terminal = new DiscordTerminal(client, {
        prefix: '>',
        ownerIds: terminalConfig.ownerIds,
        channelId: terminalConfig.terminalChannelId,
        botName: 'CleanMe Bot'
    });
    terminal.init();

    // Deploy commands on startup
    await deployCommands();

    // Start presence rotation (every 30 seconds)
    updatePresence();
    setInterval(updatePresence, 30000);
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    // Handle button interactions
    if (interaction.isButton()) {
        await handleButton(interaction);
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // Check if user has admin permissions (except for help)
    if (commandName !== 'help') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ You need Administrator permissions to use this command.',
                ephemeral: true
            });
        }
    }

    switch (commandName) {
        case 'help':
            await handleHelp(interaction);
            break;
        case 'save':
            await handleSave(interaction);
            break;
        case 'list':
            await handleList(interaction);
            break;
        case 'copy':
            await handleCopy(interaction);
            break;
        case 'clean':
            await handleClean(interaction);
            break;
        case 'cleanroles':
            await handleCleanRoles(interaction);
            break;
        case 'cleanchannels':
            await handleCleanChannels(interaction);
            break;
    }
});

// Help command
async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🧹 CleanMe Bot - Help')
        .setColor(0x5865F2)
        .setDescription('CleanMe helps you manage, backup, and restore your Discord server configuration.')
        .addFields(
            {
                name: '📥 /save',
                value: 'Save your current server configuration (roles, channels, categories). Each server can have one save. Running again will prompt to override.',
                inline: false
            },
            {
                name: '📋 /list',
                value: 'Check if your server has a saved configuration and view its details.',
                inline: false
            },
            {
                name: '📤 /copy [serverid]',
                value: 'Copy another server\'s saved configuration to your server. **Warning:** This will wipe your current setup first!',
                inline: false
            },
            {
                name: '🗑️ /clean',
                value: 'Delete ALL channels and roles from your server (except @everyone and the bot\'s role).',
                inline: false
            },
            {
                name: '🎭 /cleanroles',
                value: 'Delete all roles from your server (except @everyone and roles above the bot).',
                inline: false
            },
            {
                name: '📁 /cleanchannels',
                value: 'Delete all channels and categories from your server.',
                inline: false
            }
        )
        .addFields({
            name: '⚠️ Important Notes',
            value: '• Only **Administrators** can use these commands (except /help)\n• Save data can be shared between servers using the server ID\n• **Be careful!** Clean and copy operations are destructive and cannot be undone!',
            inline: false
        })
        .setFooter({ text: 'CleanMe Bot • Use responsibly!' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Save command
async function handleSave(interaction) {
    const saves = loadSaves();
    const guildId = interaction.guild.id;

    // Check if save already exists
    if (saves[guildId]) {
        const confirmId = `save_override_${guildId}_${Date.now()}`;
        pendingConfirmations.set(confirmId, {
            type: 'save_override',
            guildId: guildId,
            userId: interaction.user.id,
            expires: Date.now() + 60000 // 1 minute
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_${confirmId}`)
                    .setLabel('Override Save')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cancel_${confirmId}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Save Already Exists')
            .setColor(0xFFA500)
            .setDescription(`This server already has a saved configuration from **${new Date(saves[guildId].savedAt).toLocaleString()}**.\n\nDo you want to override it?`)
            .addFields(
                { name: 'Saved Roles', value: `${saves[guildId].roles.length}`, inline: true },
                { name: 'Saved Channels', value: `${saves[guildId].channels.length}`, inline: true },
                { name: 'Saved Categories', value: `${saves[guildId].categories.length}`, inline: true }
            );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    await performSave(interaction);
}

async function performSave(interaction, isOverride = false) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const guild = interaction.guild;
        const saves = loadSaves();

        // Gather server data
        const serverData = {
            guildName: guild.name,
            savedAt: Date.now(),
            savedBy: interaction.user.id,
            roles: [],
            channels: [],
            categories: []
        };

        // Save roles (exclude @everyone and managed roles)
        guild.roles.cache.forEach(role => {
            if (role.id !== guild.id && !role.managed) {
                serverData.roles.push({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable
                });
            }
        });

        // Sort roles by position (highest first for proper recreation)
        serverData.roles.sort((a, b) => b.position - a.position);

        // Save categories first
        guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).forEach(category => {
            serverData.categories.push({
                name: category.name,
                position: category.position,
                permissionOverwrites: serializePermissions(category.permissionOverwrites.cache, guild)
            });
        });

        // Sort categories by position
        serverData.categories.sort((a, b) => a.position - b.position);

        // Save channels
        guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory).forEach(channel => {
            serverData.channels.push({
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parentName: channel.parent ? channel.parent.name : null,
                topic: channel.topic || null,
                nsfw: channel.nsfw || false,
                rateLimitPerUser: channel.rateLimitPerUser || 0,
                bitrate: channel.bitrate || null,
                userLimit: channel.userLimit || null,
                permissionOverwrites: serializePermissions(channel.permissionOverwrites.cache, guild)
            });
        });

        // Sort channels by position within their category
        serverData.channels.sort((a, b) => a.position - b.position);

        // Save to file
        saves[guild.id] = serverData;
        saveSaves(saves);

        const embed = new EmbedBuilder()
            .setTitle(isOverride ? '✅ Save Overridden' : '✅ Server Saved')
            .setColor(0x00FF00)
            .setDescription(`Server configuration has been saved successfully!`)
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Roles Saved', value: `${serverData.roles.length}`, inline: true },
                { name: 'Channels Saved', value: `${serverData.channels.length}`, inline: true },
                { name: 'Categories Saved', value: `${serverData.categories.length}`, inline: true }
            )
            .setFooter({ text: `Others can copy this setup using: /copy ${guild.id}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], components: [] });

    } catch (error) {
        console.error('Save error:', error);
        await interaction.editReply({
            content: `❌ Error saving server: ${error.message}`,
            components: []
        });
    }
}

// Helper function to serialize permission overwrites
function serializePermissions(overwrites, guild) {
    const serialized = [];
    overwrites.forEach(overwrite => {
        // Find the role/member name for this overwrite
        let targetName = null;
        let targetType = overwrite.type; // 0 = role, 1 = member

        if (overwrite.type === 0) { // Role
            const role = guild.roles.cache.get(overwrite.id);
            if (role) {
                targetName = role.id === guild.id ? '@everyone' : role.name;
            }
        }
        // We skip member-specific permissions as they can't be reliably restored

        if (targetName) {
            serialized.push({
                targetName: targetName,
                targetType: targetType,
                allow: overwrite.allow.bitfield.toString(),
                deny: overwrite.deny.bitfield.toString()
            });
        }
    });
    return serialized;
}

// List command
async function handleList(interaction) {
    const saves = loadSaves();
    const guildId = interaction.guild.id;

    if (!saves[guildId]) {
        const embed = new EmbedBuilder()
            .setTitle('📋 Server Save Status')
            .setColor(0xFF6B6B)
            .setDescription('This server does **not** have a saved configuration.')
            .addFields({
                name: 'How to Save',
                value: 'Use `/save` to save your current server setup.',
                inline: false
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const save = saves[guildId];
    const embed = new EmbedBuilder()
        .setTitle('📋 Server Save Status')
        .setColor(0x00FF00)
        .setDescription('This server **has** a saved configuration!')
        .addFields(
            { name: 'Server Name (at save time)', value: save.guildName, inline: true },
            { name: 'Server ID', value: guildId, inline: true },
            { name: 'Saved At', value: new Date(save.savedAt).toLocaleString(), inline: true },
            { name: 'Roles', value: `${save.roles.length}`, inline: true },
            { name: 'Channels', value: `${save.channels.length}`, inline: true },
            { name: 'Categories', value: `${save.categories.length}`, inline: true }
        )
        .addFields({
            name: 'Share This Setup',
            value: `Others can copy this setup using:\n\`/copy ${guildId}\``,
            inline: false
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Copy command
async function handleCopy(interaction) {
    const targetServerId = interaction.options.getString('serverid');
    const saves = loadSaves();

    // Check if target server has a save
    if (!saves[targetServerId]) {
        return interaction.reply({
            content: `❌ No saved configuration found for server ID: \`${targetServerId}\``,
            ephemeral: true
        });
    }

    const save = saves[targetServerId];
    const confirmId = `copy_${targetServerId}_${interaction.guild.id}_${Date.now()}`;

    pendingConfirmations.set(confirmId, {
        type: 'copy',
        sourceServerId: targetServerId,
        targetGuildId: interaction.guild.id,
        userId: interaction.user.id,
        expires: Date.now() + 60000
    });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${confirmId}`)
                .setLabel('Yes, Wipe & Copy')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cancel_${confirmId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Server Copy')
        .setColor(0xFF0000)
        .setDescription(`**WARNING:** This will **DELETE ALL** channels and roles from your current server, then recreate the setup from **${save.guildName}**.`)
        .addFields(
            { name: 'Source Server', value: save.guildName, inline: true },
            { name: 'Source ID', value: targetServerId, inline: true },
            { name: 'Saved At', value: new Date(save.savedAt).toLocaleString(), inline: true },
            { name: 'Roles to Create', value: `${save.roles.length}`, inline: true },
            { name: 'Channels to Create', value: `${save.channels.length}`, inline: true },
            { name: 'Categories to Create', value: `${save.categories.length}`, inline: true }
        )
        .addFields({
            name: '🚨 This action cannot be undone!',
            value: 'Make sure you have saved your current server configuration if you want to keep it.',
            inline: false
        });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function performCopy(interaction, sourceServerId) {
    const saves = loadSaves();
    const save = saves[sourceServerId];
    const guild = interaction.guild;

    const statusEmbed = new EmbedBuilder()
        .setTitle('🔄 Copying Server Configuration...')
        .setColor(0xFFA500)
        .setDescription('Please wait while the server is being configured...')
        .addFields({ name: 'Status', value: 'Starting...', inline: false });

    await interaction.editReply({ embeds: [statusEmbed], components: [] });

    try {
        // Step 1: Delete all channels
        statusEmbed.setFields({ name: 'Status', value: '🗑️ Deleting channels...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        const channels = guild.channels.cache.filter(c => c.deletable);
        for (const [, channel] of channels) {
            try {
                await channel.delete();
                await sleep(500); // Rate limit protection
            } catch (e) {
                console.log(`Could not delete channel ${channel.name}: ${e.message}`);
            }
        }

        // Step 2: Delete all roles
        statusEmbed.setFields({ name: 'Status', value: '🗑️ Deleting roles...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        const roles = guild.roles.cache.filter(r =>
            r.id !== guild.id &&
            !r.managed &&
            r.position < guild.members.me.roles.highest.position
        );
        for (const [, role] of roles) {
            try {
                await role.delete();
                await sleep(300);
            } catch (e) {
                console.log(`Could not delete role ${role.name}: ${e.message}`);
            }
        }

        // Step 3: Create roles
        statusEmbed.setFields({ name: 'Status', value: '🎭 Creating roles...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        const roleMap = new Map(); // Map old role names to new role objects
        for (const roleData of save.roles.reverse()) { // Reverse to create lowest first
            try {
                const newRole = await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable,
                    reason: 'CleanMe Bot - Server Copy'
                });
                roleMap.set(roleData.name, newRole);
                await sleep(300);
            } catch (e) {
                console.log(`Could not create role ${roleData.name}: ${e.message}`);
            }
        }

        // Step 4: Create categories
        statusEmbed.setFields({ name: 'Status', value: '📁 Creating categories...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        const categoryMap = new Map(); // Map category names to new category objects
        for (const catData of save.categories) {
            try {
                const permissionOverwrites = buildPermissionOverwrites(catData.permissionOverwrites, roleMap, guild);
                const newCategory = await guild.channels.create({
                    name: catData.name,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: permissionOverwrites,
                    reason: 'CleanMe Bot - Server Copy'
                });
                categoryMap.set(catData.name, newCategory);
                await sleep(300);
            } catch (e) {
                console.log(`Could not create category ${catData.name}: ${e.message}`);
            }
        }

        // Step 5: Create channels
        statusEmbed.setFields({ name: 'Status', value: '📺 Creating channels...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        for (const channelData of save.channels) {
            try {
                const permissionOverwrites = buildPermissionOverwrites(channelData.permissionOverwrites, roleMap, guild);
                const channelOptions = {
                    name: channelData.name,
                    type: channelData.type,
                    parent: channelData.parentName ? categoryMap.get(channelData.parentName) : null,
                    permissionOverwrites: permissionOverwrites,
                    reason: 'CleanMe Bot - Server Copy'
                };

                // Add type-specific options
                if (channelData.type === ChannelType.GuildText) {
                    if (channelData.topic) channelOptions.topic = channelData.topic;
                    if (channelData.nsfw) channelOptions.nsfw = channelData.nsfw;
                    if (channelData.rateLimitPerUser) channelOptions.rateLimitPerUser = channelData.rateLimitPerUser;
                } else if (channelData.type === ChannelType.GuildVoice || channelData.type === ChannelType.GuildStageVoice) {
                    if (channelData.bitrate) channelOptions.bitrate = channelData.bitrate;
                    if (channelData.userLimit) channelOptions.userLimit = channelData.userLimit;
                }

                await guild.channels.create(channelOptions);
                await sleep(300);
            } catch (e) {
                console.log(`Could not create channel ${channelData.name}: ${e.message}`);
            }
        }

        // Done!
        const doneEmbed = new EmbedBuilder()
            .setTitle('✅ Server Copy Complete!')
            .setColor(0x00FF00)
            .setDescription(`Successfully copied configuration from **${save.guildName}**!`)
            .addFields(
                { name: 'Roles Created', value: `${roleMap.size}`, inline: true },
                { name: 'Categories Created', value: `${categoryMap.size}`, inline: true },
                { name: 'Channels Created', value: `${save.channels.length}`, inline: true }
            )
            .setTimestamp();

        // Try to find a text channel to send the completion message
        const textChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
        if (textChannel) {
            await textChannel.send({ embeds: [doneEmbed] });
        }

    } catch (error) {
        console.error('Copy error:', error);
        // Try to send error message somewhere
        const textChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
        if (textChannel) {
            await textChannel.send(`❌ Error during copy: ${error.message}`);
        }
    }
}

// Helper function to build permission overwrites from saved data
function buildPermissionOverwrites(savedOverwrites, roleMap, guild) {
    const overwrites = [];
    for (const perm of savedOverwrites) {
        let targetId;
        if (perm.targetName === '@everyone') {
            targetId = guild.id;
        } else {
            const role = roleMap.get(perm.targetName);
            if (role) {
                targetId = role.id;
            } else {
                continue; // Skip if role doesn't exist
            }
        }
        overwrites.push({
            id: targetId,
            type: perm.targetType,
            allow: BigInt(perm.allow),
            deny: BigInt(perm.deny)
        });
    }
    return overwrites;
}

// Clean command (delete everything)
async function handleClean(interaction) {
    const confirmId = `clean_${interaction.guild.id}_${Date.now()}`;

    pendingConfirmations.set(confirmId, {
        type: 'clean',
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        expires: Date.now() + 60000
    });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${confirmId}`)
                .setLabel('Yes, Delete Everything')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cancel_${confirmId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setTitle('🚨 DANGER: Clean Server')
        .setColor(0xFF0000)
        .setDescription('**This will DELETE ALL channels and roles from your server!**\n\nOnly @everyone and the bot\'s required roles will remain.')
        .addFields({
            name: '⚠️ This action CANNOT be undone!',
            value: 'Consider using `/save` first to backup your configuration.',
            inline: false
        });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function performClean(interaction) {
    const guild = interaction.guild;

    const statusEmbed = new EmbedBuilder()
        .setTitle('🗑️ Cleaning Server...')
        .setColor(0xFF0000)
        .setDescription('Please wait...')
        .addFields({ name: 'Status', value: 'Starting...', inline: false });

    await interaction.editReply({ embeds: [statusEmbed], components: [] });

    try {
        // Delete channels
        statusEmbed.setFields({ name: 'Status', value: '🗑️ Deleting channels...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        let deletedChannels = 0;
        const channels = guild.channels.cache.filter(c => c.deletable);
        for (const [, channel] of channels) {
            try {
                await channel.delete();
                deletedChannels++;
                await sleep(500);
            } catch (e) {
                console.log(`Could not delete channel: ${e.message}`);
            }
        }

        // Delete roles
        statusEmbed.setFields({ name: 'Status', value: '🗑️ Deleting roles...', inline: false });
        await interaction.editReply({ embeds: [statusEmbed] });

        let deletedRoles = 0;
        const roles = guild.roles.cache.filter(r =>
            r.id !== guild.id &&
            !r.managed &&
            r.position < guild.members.me.roles.highest.position
        );
        for (const [, role] of roles) {
            try {
                await role.delete();
                deletedRoles++;
                await sleep(300);
            } catch (e) {
                console.log(`Could not delete role: ${e.message}`);
            }
        }

        // Create a general channel to send completion message
        const generalChannel = await guild.channels.create({
            name: 'general',
            type: ChannelType.GuildText,
            reason: 'CleanMe Bot - Created after clean'
        });

        const doneEmbed = new EmbedBuilder()
            .setTitle('✅ Server Cleaned!')
            .setColor(0x00FF00)
            .setDescription('Server has been wiped clean.')
            .addFields(
                { name: 'Channels Deleted', value: `${deletedChannels}`, inline: true },
                { name: 'Roles Deleted', value: `${deletedRoles}`, inline: true }
            )
            .setTimestamp();

        await generalChannel.send({ embeds: [doneEmbed] });

    } catch (error) {
        console.error('Clean error:', error);
    }
}

// Clean roles command
async function handleCleanRoles(interaction) {
    const confirmId = `cleanroles_${interaction.guild.id}_${Date.now()}`;

    pendingConfirmations.set(confirmId, {
        type: 'cleanroles',
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        expires: Date.now() + 60000
    });

    const deletableRoles = interaction.guild.roles.cache.filter(r =>
        r.id !== interaction.guild.id &&
        !r.managed &&
        r.position < interaction.guild.members.me.roles.highest.position
    );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${confirmId}`)
                .setLabel('Yes, Delete All Roles')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cancel_${confirmId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Role Deletion')
        .setColor(0xFF0000)
        .setDescription(`This will delete **${deletableRoles.size}** roles from your server.`)
        .addFields({
            name: '🚨 This action cannot be undone!',
            value: 'Roles above the bot and managed roles will not be deleted.',
            inline: false
        });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function performCleanRoles(interaction) {
    const guild = interaction.guild;

    await interaction.editReply({
        content: '🗑️ Deleting roles...',
        embeds: [],
        components: []
    });

    let deletedCount = 0;
    const roles = guild.roles.cache.filter(r =>
        r.id !== guild.id &&
        !r.managed &&
        r.position < guild.members.me.roles.highest.position
    );

    for (const [, role] of roles) {
        try {
            await role.delete();
            deletedCount++;
            await sleep(300);
        } catch (e) {
            console.log(`Could not delete role ${role.name}: ${e.message}`);
        }
    }

    await interaction.editReply({
        content: `✅ Deleted **${deletedCount}** roles!`,
        embeds: [],
        components: []
    });
}

// Clean channels command
async function handleCleanChannels(interaction) {
    const confirmId = `cleanchannels_${interaction.guild.id}_${Date.now()}`;

    pendingConfirmations.set(confirmId, {
        type: 'cleanchannels',
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        expires: Date.now() + 60000
    });

    const deletableChannels = interaction.guild.channels.cache.filter(c => c.deletable);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${confirmId}`)
                .setLabel('Yes, Delete All Channels')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cancel_${confirmId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Channel Deletion')
        .setColor(0xFF0000)
        .setDescription(`This will delete **${deletableChannels.size}** channels and categories from your server.`)
        .addFields({
            name: '🚨 This action cannot be undone!',
            value: 'A new #general channel will be created after deletion.',
            inline: false
        });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function performCleanChannels(interaction) {
    const guild = interaction.guild;

    await interaction.editReply({
        content: '🗑️ Deleting channels...',
        embeds: [],
        components: []
    });

    let deletedCount = 0;
    const channels = guild.channels.cache.filter(c => c.deletable);

    for (const [, channel] of channels) {
        try {
            await channel.delete();
            deletedCount++;
            await sleep(500);
        } catch (e) {
            console.log(`Could not delete channel ${channel.name}: ${e.message}`);
        }
    }

    // Create a general channel
    const generalChannel = await guild.channels.create({
        name: 'general',
        type: ChannelType.GuildText,
        reason: 'CleanMe Bot - Created after channel clean'
    });

    await generalChannel.send(`✅ Deleted **${deletedCount}** channels! This channel was created as a default.`);
}

// Handle button interactions
async function handleButton(interaction) {
    const customId = interaction.customId;
    const [action, ...rest] = customId.split('_');
    const confirmId = rest.join('_');

    const pending = pendingConfirmations.get(confirmId);

    if (!pending) {
        return interaction.reply({
            content: '❌ This confirmation has expired. Please run the command again.',
            ephemeral: true
        });
    }

    // Check if same user
    if (pending.userId !== interaction.user.id) {
        return interaction.reply({
            content: '❌ Only the person who initiated this action can confirm it.',
            ephemeral: true
        });
    }

    // Check expiration
    if (Date.now() > pending.expires) {
        pendingConfirmations.delete(confirmId);
        return interaction.reply({
            content: '❌ This confirmation has expired. Please run the command again.',
            ephemeral: true
        });
    }

    pendingConfirmations.delete(confirmId);

    if (action === 'cancel') {
        return interaction.update({
            content: '❌ Action cancelled.',
            embeds: [],
            components: []
        });
    }

    // Handle confirmations
    if (action === 'confirm') {
        switch (pending.type) {
            case 'save_override':
                await interaction.deferUpdate();
                await performSave(interaction, true);
                break;
            case 'copy':
                await interaction.deferUpdate();
                await performCopy(interaction, pending.sourceServerId);
                break;
            case 'clean':
                await interaction.deferUpdate();
                await performClean(interaction);
                break;
            case 'cleanroles':
                await interaction.deferUpdate();
                await performCleanRoles(interaction);
                break;
            case 'cleanchannels':
                await interaction.deferUpdate();
                await performCleanChannels(interaction);
                break;
        }
    }
}

// Utility function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Process handlers for logging
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    if (terminal) {
        terminal.log(`Unhandled rejection: ${error}`, 'error');
    }
});

process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    if (terminal) {
        await terminal.log(`Uncaught exception: ${error.message}`, 'error');
    }
    process.exit(1);
});

process.on('SIGINT', async () => {
    if (terminal) {
        await terminal.log('Shutting down (SIGINT)', 'warn');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (terminal) {
        await terminal.log('Shutting down (SIGTERM)', 'warn');
    }
    process.exit(0);
});

// Login
client.login(process.env.BOT_TOKEN);
