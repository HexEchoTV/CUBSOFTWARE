const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to recursively read command files from directories
function loadCommands(dir) {
    const commands = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            // Recursively load commands from subdirectories
            commands.push(...loadCommands(itemPath));
        } else if (item.isFile() && item.name.endsWith('.js')) {
            // Load command file
            try {
                // Clear require cache to get fresh command data
                delete require.cache[require.resolve(itemPath)];
                const command = require(itemPath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            } catch (error) {
                console.error(`Error loading command ${item.name}:`, error.message);
            }
        }
    }

    return commands;
}

async function deployCommands() {
    try {
        const commandsPath = path.join(__dirname, 'commands');
        const commands = loadCommands(commandsPath);

        // Check for duplicate command names
        const commandNames = commands.map(cmd => cmd.name);
        const duplicates = commandNames.filter((name, index) => commandNames.indexOf(name) !== index);

        if (duplicates.length > 0) {
            const uniqueDuplicates = [...new Set(duplicates)];
            console.error('\n❌ DUPLICATE COMMAND NAMES FOUND:');
            uniqueDuplicates.forEach(dupName => {
                console.error(`   - "${dupName}" appears multiple times`);
            });
            console.error('\nAll commands being loaded:');
            commands.forEach((cmd, i) => console.error(`   ${i}. ${cmd.name}`));
            throw new Error(`Duplicate command names: ${uniqueDuplicates.join(', ')}`);
        }

        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        console.log('Command names:', commandNames.join(', '));

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        // Deploy to guild for instant updates (use applicationCommands for global)
        const guildId = '1404523107544469545';
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        return data.length;
    } catch (error) {
        console.error('Error deploying commands:', error);
        throw error;
    }
}

// If run directly, execute deployment
if (require.main === module) {
    deployCommands()
        .then(() => {
            // Allow time for connections to close properly before exiting
            setTimeout(() => process.exit(0), 1000);
        })
        .catch(() => {
            setTimeout(() => process.exit(1), 1000);
        });
}

module.exports = { deployCommands };
