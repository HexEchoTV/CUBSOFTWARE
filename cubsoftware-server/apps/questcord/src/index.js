require('dotenv').config();
const { BotClient } = require('./bot/index');
const { initializeDatabase } = require('./database/schema');
const { DatabaseMaintenance } = require('./database/maintenance');
const { MigrationManager } = require('./database/utils');
const { QuestManager } = require('./bot/utils/questManager');
const { BossManager } = require('./bot/utils/bossManager');
const { LeaderboardScheduler } = require('./utils/leaderboardScheduler');
const { startWebServer } = require('./web/server');
const DiscordTerminal = require('../../../shared/discord-terminal');

const terminalConfig = {
    ownerIds: (process.env.OWNER_IDS || '378501056008683530').split(',').map(id => id.trim()),
    terminalChannelId: process.env.TERMINAL_CHANNEL_ID || '1466190431485427856'
};

let terminal = null;

async function main() {
    try {
        console.log('Initializing QuestCord...');

        console.log('Setting up database...');
        initializeDatabase();

        const migrationManager = new MigrationManager();
        await migrationManager.runMigrations();

        DatabaseMaintenance.start();

        console.log('Deploying slash commands...');
        const { deployCommands } = require('./bot/deploy-commands');
        await deployCommands();

        console.log('Starting Discord bot...');
        const client = new BotClient();

        await client.login(process.env.DISCORD_TOKEN);

        // Initialize terminal system
        terminal = new DiscordTerminal(client, {
            prefix: '>',
            ownerIds: terminalConfig.ownerIds,
            channelId: terminalConfig.terminalChannelId,
            botName: 'QuestCord'
        });
        terminal.init();

        QuestManager.initialize();
        BossManager.initialize(client);
        LeaderboardScheduler.initialize();

        console.log('Starting web server...');
        try {
            await startWebServer(client);
            console.log('[SUCCESS] Web server started successfully');
        } catch (webError) {
            console.error('[ERROR] Web server failed to start:', webError);
            throw webError;
        }

        console.log('QuestCord initialized successfully');

        // Signal PM2 that the app is ready
        if (process.send) {
            process.send('ready');
        }
    } catch (error) {
        console.error('Failed to initialize QuestCord:', error);
        if (terminal) {
            await terminal.log(`Initialization failure: ${error.message}`, 'error');
        }
        process.exit(1);
    }
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (terminal) {
        terminal.log(`Unhandled rejection: ${error.message}`, 'error');
    }
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    if (terminal) {
        terminal.log(`Uncaught exception: ${error.message}`, 'error').then(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    if (terminal) {
        await terminal.log('Shutting down (SIGINT)', 'warn');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    if (terminal) {
        await terminal.log('Shutting down (SIGTERM)', 'warn');
    }
    process.exit(0);
});

main();



