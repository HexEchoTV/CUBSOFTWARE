require('dotenv').config();
const { BotClient } = require('./bot/index');
const { initializeDatabase } = require('./database/schema');
const { DatabaseMaintenance } = require('./database/maintenance');
const { MigrationManager } = require('./database/utils');
const { QuestManager } = require('./bot/utils/questManager');
const { BossManager } = require('./bot/utils/bossManager');
const { LeaderboardScheduler } = require('./utils/leaderboardScheduler');
const { startWebServer } = require('./web/server');
const { initializeReporting, getReportingInstance } = require('./utils/reportingSystem');

let reportingSystem = null;

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

        // Initialize reporting system
        reportingSystem = initializeReporting(client);

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
        if (reportingSystem) {
            await reportingSystem.sendErrorReport(error, 'Initialization failure');
        }
        process.exit(1);
    }
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (reportingSystem) {
        reportingSystem.sendErrorReport(error, 'Unhandled promise rejection');
    }
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    if (reportingSystem) {
        reportingSystem.sendErrorReport(error, 'Uncaught exception').then(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    if (reportingSystem) {
        await reportingSystem.sendShutdownReport('SIGINT received');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    if (reportingSystem) {
        await reportingSystem.sendShutdownReport('SIGTERM received');
    }
    process.exit(0);
});

main();

module.exports = { getReportingInstance };



